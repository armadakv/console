package armada

import (
	"context"
	"crypto/tls"
	"fmt"
	"math/rand"
	"strings"
	"sync"
	"time"

	"google.golang.org/grpc/connectivity"

	regattapb "github.com/armadakv/console/backend/armada/pb"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
)

// ConnectionPoolInterface defines the interface for a connection pool
// This makes it easier to mock in tests
type ConnectionPoolInterface interface {
	// GetConnection gets or creates a connection to a server
	GetConnection(ctx context.Context, serverAddress string) (*ServerConnection, error)

	// GetKnownAddresses returns a list of all known server addresses
	GetKnownAddresses() []string

	// Close closes all connections in the pool
	Close() error
}

// reconnectConfig holds configuration for reconnection attempts
type reconnectConfig struct {
	// maxRetries is the maximum number of reconnection attempts before giving up
	maxRetries int
	// baseDelay is the base delay for exponential backoff in milliseconds
	baseDelay time.Duration
	// maxDelay is the maximum delay between reconnection attempts in milliseconds
	maxDelay time.Duration
}

// ConnectionPool manages a pool of gRPC connections to Armada servers
type ConnectionPool struct {
	// logger is the structured logger for logging
	logger *zap.Logger

	// addressToConnection maps server addresses to connections
	// This allows multiple addresses to point to the same underlying connection
	addressToConnection map[string]*ServerConnection

	// idToConnection maps server IDs to connections
	// This ensures we have only one connection per physical server
	idToConnection map[string]*ServerConnection

	// connectionLock protects access to both maps
	connectionLock sync.RWMutex

	// reconnectCfg holds configuration for reconnection attempts
	reconnectCfg reconnectConfig
}

// ServerConnection holds a gRPC connection and its associated clients
type ServerConnection struct {
	// conn is the gRPC connection to the server
	conn *grpc.ClientConn

	// KVClient is the gRPC client for key-value operations
	KVClient regattapb.KVClient

	// ClusterClient is the gRPC client for cluster operations
	ClusterClient regattapb.ClusterClient

	// TablesClient is the gRPC client for table operations
	TablesClient regattapb.TablesClient

	// MetricsClient is the gRPC client for Prometheus metrics operations
	MetricsClient regattapb.MetricsClient

	// NodeID is the ID of the node this connection is connected to
	NodeID string

	// NodeName is the name of the node this connection is connected to
	NodeName string
}

// NodeInfo holds information about a node
type NodeInfo struct {
	NodeID   string
	NodeName string
}

// ServerInfo holds information about a server
type ServerInfo struct {
	ID              string
	Name            string
	Addresses       []string
	PrimaryAddress  string
	ConnectionState string
}

// NewConnectionPool creates a new connection pool with default reconnect configuration
func NewConnectionPool(logger *zap.Logger) *ConnectionPool {
	pool := &ConnectionPool{
		logger:              logger,
		addressToConnection: make(map[string]*ServerConnection),
		idToConnection:      make(map[string]*ServerConnection),
		reconnectCfg: reconnectConfig{
			maxRetries: 5,
			baseDelay:  500 * time.Millisecond,
			maxDelay:   30 * time.Second,
		},
	}

	return pool
}

// createGRPCConnection creates a new gRPC connection to the specified address.
// It handles the protocol detection and appropriate credential setup.
//
// Parameters:
//   - serverAddress: The address of the server to connect to.
//   - logger: The logger for logging connection actions.
//
// Returns:
//   - A gRPC connection to the server.
//   - An error if the connection could not be established.
func createGRPCConnection(_ context.Context, serverAddress string, logger *zap.Logger) (*grpc.ClientConn, error) {
	var creds credentials.TransportCredentials
	var dialAddress string

	// Check if address begins with http or https
	if strings.HasPrefix(serverAddress, "https://") {
		// Use TLS for https
		creds = credentials.NewTLS(&tls.Config{})
		// Remove https:// prefix
		dialAddress = strings.TrimPrefix(serverAddress, "https://")
	} else if strings.HasPrefix(serverAddress, "http://") {
		// Use insecure connection for http
		creds = insecure.NewCredentials()
		// Remove http:// prefix
		dialAddress = strings.TrimPrefix(serverAddress, "http://")
	} else {
		// Default to insecure if no protocol specified
		creds = insecure.NewCredentials()
		dialAddress = serverAddress
	}

	// Check if we need to apply a schema - only apply dns:/// if not an IP address and no port is specified
	var target string
	if strings.Contains(dialAddress, ":") || strings.Contains(dialAddress, ".") {
		// If it contains a colon (port) or periods (likely an IP), use as is
		target = dialAddress
	} else {
		// For hostnames without port, use dns resolver
		target = "dns:///" + dialAddress
	}

	logger.Info("Dialing Armada server",
		zap.String("address", serverAddress),
		zap.String("target", target))

	// Using NewClient which is the correct approach for this project
	conn, err := grpc.NewClient(target, grpc.WithTransportCredentials(creds))
	if err != nil {
		logger.Error("Failed to connect to Armada server", zap.Error(err))
		return nil, err
	}
	return conn, nil
}

// fetchNodeInfo fetches node information for a given server connection
func (p *ConnectionPool) fetchNodeInfo(ctx context.Context, serverConn *ServerConnection, serverAddress string) (*NodeInfo, error) {
	p.logger.Debug("Fetching node information", zap.String("address", serverAddress))

	// Call the MemberList method to get cluster information
	resp, err := serverConn.ClusterClient.MemberList(ctx, &regattapb.MemberListRequest{})
	if err != nil {
		return nil, fmt.Errorf("failed to get member list from server: %w", err)
	}

	// Find the member that matches our server address
	for _, member := range resp.GetMembers() {
		// Check if this member's client URLs match our server address
		for _, clientURL := range member.GetClientURLs() {
			if clientURL == serverAddress {
				p.logger.Debug("Found node information",
					zap.String("address", serverAddress),
					zap.String("nodeID", member.GetId()),
					zap.String("nodeName", member.GetName()))

				return &NodeInfo{
					NodeID:   member.GetId(),
					NodeName: member.GetName(),
				}, nil
			}
		}
	}

	// If we couldn't find an exact match, try to match by hostname part
	serverHost := extractHostname(serverAddress)
	for _, member := range resp.GetMembers() {
		for _, clientURL := range member.GetClientURLs() {
			clientHost := extractHostname(clientURL)
			if clientHost == serverHost {
				p.logger.Debug("Found node information by hostname match",
					zap.String("address", serverAddress),
					zap.String("hostname", serverHost),
					zap.String("nodeID", member.GetId()),
					zap.String("nodeName", member.GetName()))

				return &NodeInfo{
					NodeID:   member.GetId(),
					NodeName: member.GetName(),
				}, nil
			}
		}
	}

	// If we couldn't find a match, return an error
	return nil, fmt.Errorf("could not find node information for server at %s", serverAddress)
}

// extractHostname extracts the hostname part from a URL or address
func extractHostname(address string) string {
	// Strip protocol prefix if present
	hostname := address
	if strings.HasPrefix(hostname, "http://") {
		hostname = strings.TrimPrefix(hostname, "http://")
	} else if strings.HasPrefix(hostname, "https://") {
		hostname = strings.TrimPrefix(hostname, "https://")
	}

	// Strip port if present
	if idx := strings.LastIndex(hostname, ":"); idx != -1 {
		hostname = hostname[:idx]
	}

	return hostname
}

// isConnectionHealthy checks if a connection is in a healthy state (Ready or Idle)
func isConnectionHealthy(conn *grpc.ClientConn) bool {
	return conn != nil && (conn.GetState() == connectivity.Ready || conn.GetState() == connectivity.Idle)
}

// createServerConnection creates a new ServerConnection with proper clients
func createServerConnection(conn *grpc.ClientConn) *ServerConnection {
	return &ServerConnection{
		conn:          conn,
		KVClient:      regattapb.NewKVClient(conn),
		ClusterClient: regattapb.NewClusterClient(conn),
		TablesClient:  regattapb.NewTablesClient(conn),
		MetricsClient: regattapb.NewMetricsClient(conn),
	}
}

// getHealthyExistingConnection tries to get an existing healthy connection
// with just a read lock for better concurrency
func (p *ConnectionPool) getHealthyExistingConnection(serverAddress string) *ServerConnection {
	p.connectionLock.RLock()
	defer p.connectionLock.RUnlock()

	serverConn, exists := p.addressToConnection[serverAddress]
	if exists && serverConn != nil && isConnectionHealthy(serverConn.conn) {
		p.logger.Debug("Using cached healthy connection", zap.String("address", serverAddress))
		return serverConn
	}

	return nil
}

// getHealthyConnectionLocked checks for a healthy connection while holding the write lock
// This is used after acquiring the write lock to double-check before creating a new connection
func (p *ConnectionPool) getHealthyConnectionLocked(serverAddress string) *ServerConnection {
	serverConn, exists := p.addressToConnection[serverAddress]
	if exists && serverConn != nil && isConnectionHealthy(serverConn.conn) {
		p.logger.Debug("Connection fixed by another goroutine", zap.String("address", serverAddress))
		return serverConn
	}

	return nil
}

// createNewConnection creates a new connection to the server
// The caller must hold the connection lock before calling this method
func (p *ConnectionPool) createNewConnection(ctx context.Context, serverAddress string) (*ServerConnection, error) {
	// Create a new gRPC connection
	conn, err := createGRPCConnection(ctx, serverAddress, p.logger)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection to %s: %w", serverAddress, err)
	}

	// Create a new server connection with the appropriate clients
	newServerConn := createServerConnection(conn)

	// Fetch node information to identify the server
	nodeInfo, err := p.fetchNodeInfo(ctx, newServerConn, serverAddress)
	if err != nil {
		p.logger.Warn("Failed to fetch node information, continuing with connection",
			zap.String("address", serverAddress),
			zap.Error(err))
	} else {
		// Add node info to the connection
		newServerConn.NodeID = nodeInfo.NodeID
		newServerConn.NodeName = nodeInfo.NodeName

		// Check if we already have a connection for this server ID
		if p.handleExistingNodeConnection(serverAddress, nodeInfo.NodeID, newServerConn, conn) {
			// The method returns true if it handled an existing connection and we should return it
			return p.addressToConnection[serverAddress], nil
		}

		// Update the ID-to-connection map with this connection
		p.idToConnection[nodeInfo.NodeID] = newServerConn
	}

	// Add this address to the mapping
	p.addressToConnection[serverAddress] = newServerConn

	// Try to discover more cluster members
	go p.discoverClusterMembers(context.Background(), serverAddress, newServerConn)

	return newServerConn, nil
}

// handleExistingNodeConnection handles the case where we already have a connection to the same node
// Returns true if an existing connection is reused, false if we should continue with the new one
func (p *ConnectionPool) handleExistingNodeConnection(serverAddress string, nodeID string, newConn *ServerConnection, newGRPCConn *grpc.ClientConn) bool {
	existingConn, idExists := p.idToConnection[nodeID]
	if idExists && existingConn.conn != nil {
		// We found an existing connection to this server via a different address

		// Check if the existing connection is healthy
		if isConnectionHealthy(existingConn.conn) {
			// The existing connection is healthy, so close the new one
			p.logger.Info("Found existing healthy connection to same server via different address",
				zap.String("newAddress", serverAddress),
				zap.String("serverID", nodeID),
				zap.String("serverName", newConn.NodeName))

			_ = newGRPCConn.Close() // Close the new connection since we don't need it

			// Add this address to the mapping for the existing connection
			p.addressToConnection[serverAddress] = existingConn
			return true
		}

		// Existing connection is not healthy, continue with the new connection
		// and update all references to use it instead
		p.logger.Info("Found existing unhealthy connection to same server, replacing with new connection",
			zap.String("newAddress", serverAddress),
			zap.String("serverID", nodeID),
			zap.String("serverName", newConn.NodeName))

		// Close the old connection
		_ = existingConn.conn.Close()

		// Find and update all addresses pointing to this server to use the new connection
		for addr, conn := range p.addressToConnection {
			if conn == existingConn {
				p.addressToConnection[addr] = newConn
				p.logger.Debug("Updated address mapping to use new connection",
					zap.String("address", addr),
					zap.String("serverID", nodeID))
			}
		}
	}

	return false
}

// GetConnection gets or creates a gRPC connection to the specified server address.
// It validates the connection health and attempts to reconnect if needed.
// If the address is not already in the pool, it will try to discover additional
// cluster members using this address as a seed.
// Connections are deduplicated by server ID, so multiple addresses pointing to
// the same physical server will use the same connection.
//
// Parameters:
//   - ctx: The context for the operation.
//   - serverAddress: The address of the server to connect to.
//
// Returns:
//   - The server connection containing gRPC connection and clients.
//   - An error if the connection could not be established.
func (p *ConnectionPool) GetConnection(ctx context.Context, serverAddress string) (*ServerConnection, error) {
	// Try to get an existing healthy connection first with just a read lock
	if conn := p.getHealthyExistingConnection(serverAddress); conn != nil {
		return conn, nil
	}

	// We need to create or repair a connection
	p.connectionLock.Lock()
	defer p.connectionLock.Unlock()

	// Double-check if another goroutine fixed the connection while we were waiting
	if conn := p.getHealthyConnectionLocked(serverAddress); conn != nil {
		return conn, nil
	}

	// Create a new connection
	return p.createNewConnection(ctx, serverAddress)
}

// discoverClusterMembers discovers additional cluster members using a seed address
func (p *ConnectionPool) discoverClusterMembers(ctx context.Context, seedAddress string, serverConn *ServerConnection) {
	// Create a new context with timeout for discovery
	discCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	p.logger.Info("Attempting to discover additional cluster members",
		zap.String("seedAddress", seedAddress))

	// Get cluster membership information using this server as seed
	resp, err := serverConn.ClusterClient.MemberList(discCtx, &regattapb.MemberListRequest{})
	if err != nil {
		p.logger.Warn("Failed to discover cluster members from address",
			zap.String("address", seedAddress),
			zap.Error(err))
		return
	}

	// Extract all client URLs from the member list
	newAddresses := make([]string, 0)
	for _, member := range resp.GetMembers() {
		// Skip members we already have a connection to by ID
		p.connectionLock.RLock()
		_, idExists := p.idToConnection[member.GetId()]
		p.connectionLock.RUnlock()

		if idExists {
			continue
		}

		for _, url := range member.GetClientURLs() {
			if url != "" && url != seedAddress {
				p.connectionLock.RLock()
				_, exists := p.addressToConnection[url]
				p.connectionLock.RUnlock()

				if !exists {
					newAddresses = append(newAddresses, url)
				}
			}
		}
	}

	if len(newAddresses) > 0 {
		p.logger.Info("Discovered additional cluster members",
			zap.String("seedAddress", seedAddress),
			zap.Int("newMemberCount", len(newAddresses)),
			zap.Strings("newAddresses", newAddresses))

		// Initialize connections to newly discovered addresses
		for _, addr := range newAddresses {
			go func(address string) {
				initCtx, initCancel := context.WithTimeout(context.Background(), 5*time.Second)
				defer initCancel()

				_, err := p.GetConnection(initCtx, address)
				if err != nil {
					p.logger.Warn("Failed to initialize connection to discovered member",
						zap.String("address", address),
						zap.Error(err))
				} else {
					p.logger.Debug("Successfully initialized connection to discovered member",
						zap.String("address", address))
				}
			}(addr)
		}
	} else {
		p.logger.Debug("No new cluster members discovered",
			zap.String("seedAddress", seedAddress))
	}
}

// reconnectServer attempts to reconnect to a server with exponential backoff.
//
// Parameters:
//   - ctx: The context for the operation.
//   - serverAddress: The address of the server to reconnect to.
//   - currentConn: The current connection that's in a bad state.
//
// Returns:
//   - The new gRPC connection if successful.
//   - An error if reconnection fails after all attempts.
func (p *ConnectionPool) reconnectServer(ctx context.Context, serverAddress string, currentConn *grpc.ClientConn) (*grpc.ClientConn, error) {
	p.logger.Warn("Connection to server is not healthy, attempting to reconnect",
		zap.String("address", serverAddress),
		zap.String("state", currentConn.GetState().String()))

	// Close existing connection
	if currentConn != nil {
		if err := currentConn.Close(); err != nil {
			p.logger.Warn("Error closing existing server connection",
				zap.String("address", serverAddress),
				zap.Error(err))
			// Continue with reconnection even if close fails
		}
	}

	// Reconnect with exponential backoff
	var lastError error
	currentDelay := p.reconnectCfg.baseDelay

	for attempt := 0; attempt < p.reconnectCfg.maxRetries; attempt++ {
		p.logger.Info("Server reconnection attempt",
			zap.String("address", serverAddress),
			zap.Int("attempt", attempt+1),
			zap.Int("maxAttempts", p.reconnectCfg.maxRetries),
			zap.Duration("delay", currentDelay))

		// Wait before attempting reconnection (except on first attempt)
		if attempt > 0 {
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(currentDelay):
				// Continue with reconnection attempt
			}
		}

		// Try to establish a new connection
		newConn, err := createGRPCConnection(ctx, serverAddress, p.logger)
		if err != nil {
			lastError = err
			p.logger.Warn("Server reconnection attempt failed",
				zap.String("address", serverAddress),
				zap.Int("attempt", attempt+1),
				zap.Error(err))

			// Exponential backoff with jitter
			jitter := time.Duration(rand.Int63n(int64(currentDelay) / 2))
			currentDelay = time.Duration(float64(currentDelay) * 1.5)
			currentDelay += jitter

			// Cap at max delay
			if currentDelay > p.reconnectCfg.maxDelay {
				currentDelay = p.reconnectCfg.maxDelay
			}

			continue
		}

		// Reconnection successful
		p.logger.Info("Successfully reconnected to server", zap.String("address", serverAddress))
		return newConn, nil
	}

	p.logger.Error("Failed to reconnect to server after maximum attempts",
		zap.String("address", serverAddress),
		zap.Int("maxRetries", p.reconnectCfg.maxRetries),
		zap.Error(lastError))
	return nil, fmt.Errorf("failed to reconnect to server %s after %d attempts: %w",
		serverAddress, p.reconnectCfg.maxRetries, lastError)
}

// Close closes all connections in the pool
func (p *ConnectionPool) Close() error {
	p.connectionLock.Lock()
	defer p.connectionLock.Unlock()

	var lastErr error

	// Track which connections we've already closed
	// since multiple addresses can point to the same connection
	closedConns := make(map[*grpc.ClientConn]bool)

	// Close each unique connection
	for address, serverConn := range p.addressToConnection {
		if serverConn != nil && serverConn.conn != nil {
			// Only close each connection once
			if !closedConns[serverConn.conn] {
				p.logger.Debug("Closing connection",
					zap.String("address", address),
					zap.String("nodeID", serverConn.NodeID),
					zap.String("nodeName", serverConn.NodeName))

				if err := serverConn.conn.Close(); err != nil {
					p.logger.Error("Failed to close connection",
						zap.String("address", address),
						zap.Error(err))
					lastErr = err
				}

				closedConns[serverConn.conn] = true
			}
		}
	}

	// Clear both maps
	p.addressToConnection = make(map[string]*ServerConnection)
	p.idToConnection = make(map[string]*ServerConnection)

	return lastErr
}

// GetKnownAddresses returns a list of all known server addresses in the connection pool.
// This is useful for discovering all clusters to collect metrics from.
func (p *ConnectionPool) GetKnownAddresses() []string {
	p.connectionLock.RLock()
	defer p.connectionLock.RUnlock()

	addresses := make([]string, 0, len(p.addressToConnection))
	for addr := range p.addressToConnection {
		addresses = append(addresses, addr)
	}

	return addresses
}

// GetKnownServers returns information about all unique servers in the connection pool.
// This is useful for getting a deduplicated list of servers for monitoring or UI display.
//
// Returns:
//   - A slice of ServerInfo objects containing server ID, name, and all addresses.
func (p *ConnectionPool) GetKnownServers() []ServerInfo {
	p.connectionLock.RLock()
	defer p.connectionLock.RUnlock()

	// First, build a mapping from server ID to all addresses that point to it
	serverMap := make(map[string][]string)

	for address, conn := range p.addressToConnection {
		if conn.NodeID != "" {
			serverMap[conn.NodeID] = append(serverMap[conn.NodeID], address)
		} else {
			// Handle connections where we couldn't determine the server ID
			// Use the address as a pseudo-ID to ensure these are still included
			serverMap[address] = append(serverMap[address], address)
		}
	}

	// Convert the map to a slice of ServerInfo objects
	servers := make([]ServerInfo, 0, len(serverMap))

	for id, addresses := range serverMap {
		var info ServerInfo
		info.ID = id

		// Use the connection to get the server name
		var name string
		for _, address := range addresses {
			if conn := p.addressToConnection[address]; conn != nil && conn.NodeName != "" {
				name = conn.NodeName
				break
			}
		}

		info.Name = name
		info.Addresses = addresses

		// Set primary address to first in list
		if len(addresses) > 0 {
			info.PrimaryAddress = addresses[0]
		}

		// Add the connection state
		for _, address := range addresses {
			if conn := p.addressToConnection[address]; conn != nil && conn.conn != nil {
				info.ConnectionState = conn.conn.GetState().String()
				break
			}
		}

		servers = append(servers, info)
	}

	return servers
}

// InitializeConnections initializes connections to a list of server addresses.
// This method eagerly establishes connections to the provided servers.
//
// Parameters:
//   - ctx: The context for the operation.
//   - serverAddresses: A list of server addresses to connect to.
//
// Returns:
//   - A map of server addresses to errors (if any occurred during connection initialization).
func (p *ConnectionPool) InitializeConnections(ctx context.Context, serverAddresses []string) map[string]error {
	p.logger.Info("Initializing connections to servers", zap.Int("count", len(serverAddresses)))

	errors := make(map[string]error)
	for _, address := range serverAddresses {
		_, err := p.GetConnection(ctx, address)
		if err != nil {
			p.logger.Error("Failed to initialize connection to server",
				zap.String("address", address),
				zap.Error(err))
			errors[address] = err
		}
	}

	return errors
}

// DiscoverAndConnect discovers all members in the cluster starting from the provided
// seed server address and initializes connections to them.
//
// Parameters:
//   - ctx: The context for the operation.
//   - seedServerAddress: The address of a server used to discover other cluster members.
//
// Returns:
//   - A list of all discovered server addresses.
//   - A map of server addresses to errors (if any occurred during connection initialization).
func (p *ConnectionPool) DiscoverAndConnect(ctx context.Context, seedServerAddress string) ([]string, map[string]error) {
	p.logger.Info("Discovering cluster members from seed server", zap.String("seedServer", seedServerAddress))

	// First, get a connection to the seed server
	seedConn, err := p.GetConnection(ctx, seedServerAddress)
	if err != nil {
		return nil, map[string]error{seedServerAddress: err}
	}

	// Query the server for cluster membership
	resp, err := seedConn.ClusterClient.MemberList(ctx, &regattapb.MemberListRequest{})
	if err != nil {
		return nil, map[string]error{seedServerAddress: fmt.Errorf("failed to list cluster members: %w", err)}
	}

	// Extract all client URLs from the member list
	serverAddresses := make([]string, 0)
	for _, member := range resp.GetMembers() {
		for _, url := range member.GetClientURLs() {
			if url != "" {
				serverAddresses = append(serverAddresses, url)
			}
		}
	}

	p.logger.Info("Discovered cluster members",
		zap.String("clusterName", resp.GetCluster()),
		zap.Int("memberCount", len(resp.GetMembers())),
		zap.Int("addressCount", len(serverAddresses)),
		zap.Strings("addresses", serverAddresses))

	// Skip the seed server as we already have a connection to it
	filteredAddresses := make([]string, 0, len(serverAddresses))
	for _, addr := range serverAddresses {
		if addr != seedServerAddress {
			p.connectionLock.RLock()
			_, exists := p.addressToConnection[addr]
			p.connectionLock.RUnlock()

			if !exists {
				filteredAddresses = append(filteredAddresses, addr)
			}
		}
	}

	// Initialize connections to all other servers
	errors := p.InitializeConnections(ctx, filteredAddresses)

	// Return all found addresses, not just the ones we connected to
	return serverAddresses, errors
}
