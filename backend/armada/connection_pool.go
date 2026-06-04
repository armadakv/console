package armada

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	"google.golang.org/grpc/connectivity"

	regattapb "github.com/armadakv/console/backend/armada/pb"
	"github.com/armadakv/console/backend/config"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
)

// reconnectConfig holds configuration for reconnection attempts.
type reconnectConfig struct {
	// maxRetries is the maximum number of reconnection attempts before giving up.
	maxRetries int
	// baseDelay is the base delay for exponential backoff in milliseconds.
	baseDelay time.Duration
	// maxDelay is the maximum delay between reconnection attempts in milliseconds.
	maxDelay time.Duration
}

// ConnectionPool manages a pool of gRPC connections to Armada servers.
type ConnectionPool struct {
	// logger is the structured logger for logging.
	logger *zap.Logger

	// addressToConnection maps server addresses to connections.
	// This allows multiple addresses to point to the same underlying connection.
	addressToConnection map[string]*ServerConnection

	// idToConnection maps server IDs to connections.
	// This ensures we have only one connection per physical server.
	idToConnection map[string]*ServerConnection

	// connectionLock protects access to both maps.
	connectionLock sync.RWMutex

	// reconnectCfg holds configuration for reconnection attempts.
	reconnectCfg reconnectConfig

	// armadaCfg holds the Armada connection configuration (TLS, token, etc.).
	armadaCfg config.ArmadaConfig
}

// ServerConnection holds a gRPC connection and its associated clients.
type ServerConnection struct {
	// conn is the gRPC connection to the server.
	conn *grpc.ClientConn

	// KVClient is the gRPC client for key-value operations.
	KVClient regattapb.KVClient

	// ClusterClient is the gRPC client for cluster operations.
	ClusterClient regattapb.ClusterClient

	// TablesClient is the gRPC client for table operations.
	TablesClient regattapb.TablesClient

	// MetricsClient is the gRPC client for Prometheus metrics operations.
	MetricsClient regattapb.MetricsClient

	// NodeID is the ID of the node this connection is connected to.
	NodeID string

	// NodeName is the name of the node this connection is connected to.
	NodeName string
}

// NodeInfo holds information about a node.
type NodeInfo struct {
	NodeID   string
	NodeName string
}

// ServerInfo holds information about a server.
type ServerInfo struct {
	ID              string
	Name            string
	Addresses       []string
	PrimaryAddress  string
	ConnectionState string
}

// NewConnectionPool creates a new connection pool. It validates the provided
// ArmadaConfig — including TLS settings and checking that cert files are readable —
// and returns an error if the configuration is invalid.
//
// The URL scheme determines transport security: https:// and unixs:// activate
// TLS; http:// and unix:// use plaintext. Combining TLS options with a plaintext
// scheme is rejected by config.ArmadaConfig.Validate before this is called.
//
// When cfg.Token is set without TLS being active a warning is logged, but the
// pool is still created (useful for local development).
func NewConnectionPool(logger *zap.Logger, cfg config.ArmadaConfig) (*ConnectionPool, error) {
	// Eagerly check that cert files are readable so we fail fast at startup
	// rather than discovering a bad path on the first connection attempt.
	if cfg.TLS.CACert != "" {
		if _, err := os.ReadFile(cfg.TLS.CACert); err != nil {
			return nil, fmt.Errorf("connection pool: reading CA cert %s: %w", cfg.TLS.CACert, err)
		}
	}
	if cfg.TLS.ClientCert != "" {
		if _, err := os.ReadFile(cfg.TLS.ClientCert); err != nil {
			return nil, fmt.Errorf("connection pool: reading client cert %s: %w", cfg.TLS.ClientCert, err)
		}
	}
	if cfg.TLS.ClientKey != "" {
		if _, err := os.ReadFile(cfg.TLS.ClientKey); err != nil {
			return nil, fmt.Errorf("connection pool: reading client key %s: %w", cfg.TLS.ClientKey, err)
		}
	}

	tlsActive := strings.HasPrefix(cfg.URL, "https://") || strings.HasPrefix(cfg.URL, "unixs://")
	if cfg.Token != "" && !tlsActive {
		logger.Warn("Token is configured but TLS is not active; token will be sent in plaintext")
	}

	pool := &ConnectionPool{
		logger:              logger,
		addressToConnection: make(map[string]*ServerConnection),
		idToConnection:      make(map[string]*ServerConnection),
		reconnectCfg: reconnectConfig{
			maxRetries: 5,
			baseDelay:  500 * time.Millisecond,
			maxDelay:   30 * time.Second,
		},
		armadaCfg: cfg,
	}

	return pool, nil
}

// urlInfo holds the result of parsing an Armada URL.
type urlInfo struct {
	// grpcTarget is the string to pass directly to grpc.NewClient.
	grpcTarget string
	// useTLS indicates whether TLS transport credentials should be used.
	useTLS bool
}

// parseURL parses an Armada URL into a gRPC dial target and TLS flag.
//
// Supported schemes:
//   - http://host:port   — plaintext TCP
//   - https://host:port  — TLS over TCP
//   - unix:///path       — plaintext Unix domain socket
//   - unixs:///path      — TLS over Unix domain socket
func parseURL(rawURL string) (urlInfo, error) {
	switch {
	case strings.HasPrefix(rawURL, "http://"):
		host := strings.TrimPrefix(rawURL, "http://")
		return urlInfo{grpcTarget: normalizeHostTarget(host), useTLS: false}, nil
	case strings.HasPrefix(rawURL, "https://"):
		host := strings.TrimPrefix(rawURL, "https://")
		return urlInfo{grpcTarget: normalizeHostTarget(host), useTLS: true}, nil
	case strings.HasPrefix(rawURL, "unixs://"):
		// Strip unixs:// and replace with unix:// — the socket path is preserved.
		// e.g. unixs:///run/armada.sock → unix:///run/armada.sock (TLS over socket).
		path := strings.TrimPrefix(rawURL, "unixs://")
		return urlInfo{grpcTarget: "unix://" + path, useTLS: true}, nil
	case strings.HasPrefix(rawURL, "unix://"):
		path := strings.TrimPrefix(rawURL, "unix://")
		return urlInfo{grpcTarget: "unix://" + path, useTLS: false}, nil
	default:
		return urlInfo{}, fmt.Errorf("unsupported URL scheme in %q: must be http://, https://, unix://, or unixs://", rawURL)
	}
}

// normalizeHostTarget returns a gRPC target for a TCP host address.
// Bare hostnames (no port, no dots) are prefixed with dns:/// so the
// gRPC DNS resolver is used for look-up.
func normalizeHostTarget(hostPort string) string {
	if strings.Contains(hostPort, ":") || strings.Contains(hostPort, ".") {
		return hostPort
	}
	return "dns:///" + hostPort
}

// buildTLSCredentials constructs gRPC transport credentials from TLSConfig.
// The CA certificate (if set) is read once. The client certificate and key
// are re-read on every TLS handshake via GetClientCertificate, so short-lived
// certificates are picked up automatically without restarting the process.
func buildTLSCredentials(cfg config.TLSConfig) (credentials.TransportCredentials, error) {
	tlsCfg := &tls.Config{
		InsecureSkipVerify: cfg.Insecure, //nolint:gosec
		ServerName:         cfg.ServerName,
	}

	if cfg.CACert != "" {
		caPEM, err := os.ReadFile(cfg.CACert)
		if err != nil {
			return nil, fmt.Errorf("reading CA cert %s: %w", cfg.CACert, err)
		}
		pool := x509.NewCertPool()
		if !pool.AppendCertsFromPEM(caPEM) {
			return nil, fmt.Errorf("failed to parse CA cert %s", cfg.CACert)
		}
		tlsCfg.RootCAs = pool
	}

	if cfg.ClientCert != "" {
		clientCert, clientKey := cfg.ClientCert, cfg.ClientKey
		tlsCfg.GetClientCertificate = func(*tls.CertificateRequestInfo) (*tls.Certificate, error) {
			cert, err := tls.LoadX509KeyPair(clientCert, clientKey)
			if err != nil {
				return nil, fmt.Errorf("loading client cert %s: %w", clientCert, err)
			}
			return &cert, nil
		}
	}

	return credentials.NewTLS(tlsCfg), nil
}

// tokenCredentials implements grpc/credentials.PerRPCCredentials for bearer tokens.
type tokenCredentials struct {
	token string
}

func (t tokenCredentials) GetRequestMetadata(_ context.Context, _ ...string) (map[string]string, error) {
	return map[string]string{"authorization": "Bearer " + t.token}, nil
}

// RequireTransportSecurity returns false so that a token can be used with
// plaintext transports during local development. A startup warning is logged
// by NewConnectionPool when this situation is detected.
func (t tokenCredentials) RequireTransportSecurity() bool {
	return false
}

// createGRPCConnection creates a new gRPC connection to the specified address.
// The address must include a supported scheme (http://, https://, unix://, unixs://).
// Transport credentials and optional per-RPC token auth are derived from the
// pool's ArmadaConfig.
func (p *ConnectionPool) createGRPCConnection(serverAddress string) (*grpc.ClientConn, error) {
	info, err := parseURL(serverAddress)
	if err != nil {
		return nil, err
	}

	opts := make([]grpc.DialOption, 0, 2)

	if info.useTLS {
		creds, err := buildTLSCredentials(p.armadaCfg.TLS)
		if err != nil {
			return nil, fmt.Errorf("building TLS credentials for %s: %w", serverAddress, err)
		}
		opts = append(opts, grpc.WithTransportCredentials(creds))
	} else {
		opts = append(opts, grpc.WithTransportCredentials(insecure.NewCredentials()))
	}

	if p.armadaCfg.Token != "" {
		opts = append(opts, grpc.WithPerRPCCredentials(tokenCredentials{token: p.armadaCfg.Token}))
	}

	conn, err := grpc.NewClient(info.grpcTarget, opts...)
	if err != nil {
		return nil, err
	}
	return conn, nil
}

// fetchNodeInfo fetches node information for a given server connection by calling.
// the Status RPC, which returns the responding node's own member ID directly.
// This avoids fragile address matching (e.g. localhost vs 127.0.0.1).
func (p *ConnectionPool) fetchNodeInfo(ctx context.Context, serverConn *ServerConnection, serverAddress string) (*NodeInfo, error) {
	p.logger.Debug("Fetching node information", zap.String("address", serverAddress))

	resp, err := serverConn.ClusterClient.Status(ctx, &regattapb.StatusRequest{})
	if err != nil {
		return nil, fmt.Errorf("failed to get status from server: %w", err)
	}

	if resp.GetId() == "" {
		return nil, fmt.Errorf("server at %s returned empty node ID", serverAddress)
	}

	// Status doesn't include the node name; look it up from MemberList.
	nodeName := resp.GetId() // fall back to ID if MemberList fails
	if membersResp, err := serverConn.ClusterClient.MemberList(ctx, &regattapb.MemberListRequest{}); err == nil {
		for _, m := range membersResp.GetMembers() {
			if m.GetId() == resp.GetId() {
				if m.GetName() != "" {
					nodeName = m.GetName()
				}
				break
			}
		}
	}

	p.logger.Debug("Found node information via Status API",
		zap.String("address", serverAddress),
		zap.String("nodeID", resp.GetId()),
		zap.String("nodeName", nodeName))

	return &NodeInfo{
		NodeID:   resp.GetId(),
		NodeName: nodeName,
	}, nil
}

// extractHostname extracts the hostname part from a URL or address.
func extractHostname(address string) string {
	// Unix socket paths — return the path portion as the identity.
	for _, scheme := range []string{"unixs://", "unix://"} {
		if strings.HasPrefix(address, scheme) {
			return strings.TrimPrefix(address, scheme)
		}
	}

	// Strip TCP scheme prefix if present.
	hostname := strings.TrimPrefix(strings.TrimPrefix(address, "https://"), "http://")

	// Strip port if present.
	if idx := strings.LastIndex(hostname, ":"); idx != -1 {
		hostname = hostname[:idx]
	}

	return hostname
}

// isConnectionHealthy checks if a connection is in a healthy state (Ready or Idle).
func isConnectionHealthy(conn *grpc.ClientConn) bool {
	return conn != nil && (conn.GetState() == connectivity.Ready || conn.GetState() == connectivity.Idle)
}

// createServerConnection creates a new ServerConnection with proper clients.
func createServerConnection(conn *grpc.ClientConn) *ServerConnection {
	return &ServerConnection{
		conn:          conn,
		KVClient:      regattapb.NewKVClient(conn),
		ClusterClient: regattapb.NewClusterClient(conn),
		TablesClient:  regattapb.NewTablesClient(conn),
		MetricsClient: regattapb.NewMetricsClient(conn),
	}
}

// getHealthyExistingConnection tries to get an existing healthy connection.
// with just a read lock for better concurrency.
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

// getHealthyConnectionLocked checks for a healthy connection while holding the write lock.
// This is used after acquiring the write lock to double-check before creating a new connection.
func (p *ConnectionPool) getHealthyConnectionLocked(serverAddress string) *ServerConnection {
	serverConn, exists := p.addressToConnection[serverAddress]
	if exists && serverConn != nil && isConnectionHealthy(serverConn.conn) {
		p.logger.Debug("Connection fixed by another goroutine", zap.String("address", serverAddress))
		return serverConn
	}

	return nil
}

// createNewConnection creates a new connection to the server.
// The caller must hold the connection lock before calling this method.
func (p *ConnectionPool) createNewConnection(ctx context.Context, serverAddress string) (*ServerConnection, error) {
	// Create a new gRPC connection.
	conn, err := p.createGRPCConnection(serverAddress)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection to %s: %w", serverAddress, err)
	}

	// Create a new server connection with the appropriate clients.
	newServerConn := createServerConnection(conn)

	// Fetch node information to identify the server.
	nodeInfo, err := p.fetchNodeInfo(ctx, newServerConn, serverAddress)
	if err != nil {
		p.logger.Warn("Failed to fetch node information, continuing with connection",
			zap.String("address", serverAddress),
			zap.Error(err))
	} else {
		// Add node info to the connection.
		newServerConn.NodeID = nodeInfo.NodeID
		newServerConn.NodeName = nodeInfo.NodeName

		// Check if we already have a connection for this server ID.
		if p.handleExistingNodeConnection(serverAddress, nodeInfo.NodeID, newServerConn, conn) {
			// The method returns true if it handled an existing connection and we should return it.
			return p.addressToConnection[serverAddress], nil
		}

		// Update the ID-to-connection map with this connection.
		p.idToConnection[nodeInfo.NodeID] = newServerConn
	}

	// Add this address to the mapping.
	p.addressToConnection[serverAddress] = newServerConn

	// Try to discover more cluster members.
	go p.discoverClusterMembers(context.Background(), serverAddress, newServerConn) //nolint:contextcheck,gosec

	return newServerConn, nil
}

// handleExistingNodeConnection handles the case where we already have a connection to the same node.
// Returns true if an existing connection is reused, false if we should continue with the new one.
func (p *ConnectionPool) handleExistingNodeConnection(serverAddress string, nodeID string, newConn *ServerConnection, newGRPCConn *grpc.ClientConn) bool {
	existingConn, idExists := p.idToConnection[nodeID]
	if idExists && existingConn.conn != nil {
		// We found an existing connection to this server via a different address.

		// Check if the existing connection is healthy.
		if isConnectionHealthy(existingConn.conn) {
			// The existing connection is healthy, so close the new one.
			p.logger.Info("Found existing healthy connection to same server via different address",
				zap.String("newAddress", serverAddress),
				zap.String("serverID", nodeID),
				zap.String("serverName", newConn.NodeName))

			_ = newGRPCConn.Close() // Close the new connection since we don't need it

			// Add this address to the mapping for the existing connection.
			p.addressToConnection[serverAddress] = existingConn
			return true
		}

		// Existing connection is not healthy, continue with the new connection.
		// and update all references to use it instead.
		p.logger.Info("Found existing unhealthy connection to same server, replacing with new connection",
			zap.String("newAddress", serverAddress),
			zap.String("serverID", nodeID),
			zap.String("serverName", newConn.NodeName))

		// Close the old connection.
		_ = existingConn.conn.Close()

		// Find and update all addresses pointing to this server to use the new connection.
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
// If the address is not already in the pool, it will try to discover additional.
// cluster members using this address as a seed.
// Connections are deduplicated by server ID, so multiple addresses pointing to.
// the same physical server will use the same connection.
//
// Parameters:.
//   - ctx: The context for the operation.
//   - serverAddress: The address of the server to connect to.
//
// Returns:.
//   - The server connection containing gRPC connection and clients.
//   - An error if the connection could not be established.
func (p *ConnectionPool) GetConnection(ctx context.Context, serverAddress string) (*ServerConnection, error) {
	// Try to get an existing healthy connection first with just a read lock.
	if conn := p.getHealthyExistingConnection(serverAddress); conn != nil {
		return conn, nil
	}

	// We need to create or repair a connection.
	p.connectionLock.Lock()
	defer p.connectionLock.Unlock()

	// Double-check if another goroutine fixed the connection while we were waiting.
	if conn := p.getHealthyConnectionLocked(serverAddress); conn != nil {
		return conn, nil
	}

	// Create a new connection.
	return p.createNewConnection(ctx, serverAddress)
}

// discoverClusterMembers discovers additional cluster members using a seed address.
func (p *ConnectionPool) discoverClusterMembers(ctx context.Context, seedAddress string, serverConn *ServerConnection) {
	// Create a new context with timeout for discovery.
	discCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	p.logger.Info("Attempting to discover additional cluster members",
		zap.String("seedAddress", seedAddress))

	// Get cluster membership information using this server as seed.
	resp, err := serverConn.ClusterClient.MemberList(discCtx, &regattapb.MemberListRequest{})
	if err != nil {
		p.logger.Warn("Failed to discover cluster members from address",
			zap.String("address", seedAddress),
			zap.Error(err))
		return
	}

	// Extract all client URLs from the member list.
	// Fall back to PeerURLs when ClientURLs is not populated (ArmadaKV may omit ClientURLs).
	newAddresses := make([]string, 0)
	for _, member := range resp.GetMembers() {
		// Skip members we already have a connection to by ID.
		p.connectionLock.RLock()
		_, idExists := p.idToConnection[member.GetId()]
		p.connectionLock.RUnlock()

		if idExists {
			continue
		}

		// Prefer ClientURLs; fall back to PeerURLs if ClientURLs is empty.
		urls := member.GetClientURLs()
		if len(urls) == 0 {
			urls = member.GetPeerURLs()
		}

		for _, url := range urls {
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

		// Initialize connections to newly discovered addresses.
		for _, addr := range newAddresses {
			go func(address string) { //nolint:contextcheck,gosec
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

// Close closes all connections in the pool.
func (p *ConnectionPool) Close() error {
	p.connectionLock.Lock()
	defer p.connectionLock.Unlock()

	var lastErr error

	// Track which connections we've already closed.
	// since multiple addresses can point to the same connection.
	closedConns := make(map[*grpc.ClientConn]bool)

	// Close each unique connection.
	for address, serverConn := range p.addressToConnection {
		if serverConn != nil && serverConn.conn != nil {
			// Only close each connection once.
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

	// Clear both maps.
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
// Returns:.
//   - A slice of ServerInfo objects containing server ID, name, and all addresses.
func (p *ConnectionPool) GetKnownServers() []ServerInfo {
	p.connectionLock.RLock()
	defer p.connectionLock.RUnlock()

	// First, build a mapping from server ID to all addresses that point to it.
	serverMap := make(map[string][]string)

	for address, conn := range p.addressToConnection {
		if conn.NodeID != "" {
			serverMap[conn.NodeID] = append(serverMap[conn.NodeID], address)
		} else {
			// Handle connections where we couldn't determine the server ID.
			// Use the address as a pseudo-ID to ensure these are still included.
			serverMap[address] = append(serverMap[address], address)
		}
	}

	// Convert the map to a slice of ServerInfo objects.
	servers := make([]ServerInfo, 0, len(serverMap))

	for id, addresses := range serverMap {
		var info ServerInfo
		info.ID = id

		// Use the connection to get the server name.
		var name string
		for _, address := range addresses {
			if conn := p.addressToConnection[address]; conn != nil && conn.NodeName != "" {
				name = conn.NodeName
				break
			}
		}

		info.Name = name
		info.Addresses = addresses

		// Set primary address to first in list.
		if len(addresses) > 0 {
			info.PrimaryAddress = addresses[0]
		}

		// Add the connection state.
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

// initializeConnections initializes connections to a list of server addresses.
// This method eagerly establishes connections to the provided servers.
//
// Parameters:.
//   - ctx: The context for the operation.
//   - serverAddresses: A list of server addresses to connect to.
//
// Returns:.
//   - A map of server addresses to errors (if any occurred during connection initialization).
func (p *ConnectionPool) initializeConnections(ctx context.Context, serverAddresses []string) map[string]error {
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

// DiscoverAndConnect discovers all members in the cluster starting from the provided.
// seed server address and initializes connections to them.
//
// Parameters:.
//   - ctx: The context for the operation.
//   - seedServerAddress: The address of a server used to discover other cluster members.
//
// Returns:.
//   - A list of all discovered server addresses.
//   - A map of server addresses to errors (if any occurred during connection initialization).
func (p *ConnectionPool) DiscoverAndConnect(ctx context.Context, seedServerAddress string) ([]string, map[string]error) {
	p.logger.Info("Discovering cluster members from seed server", zap.String("seedServer", seedServerAddress))

	// First, get a connection to the seed server.
	seedConn, err := p.createGRPCConnection(seedServerAddress)
	if err != nil {
		return nil, map[string]error{seedServerAddress: err}
	}
	defer func() { _ = seedConn.Close() }()
	// Query the server for cluster membership.
	resp, err := regattapb.NewClusterClient(seedConn).MemberList(ctx, &regattapb.MemberListRequest{})
	if err != nil {
		return nil, map[string]error{seedServerAddress: fmt.Errorf("failed to list cluster members: %w", err)}
	}

	// Extract all client URLs from the member list.
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

	// Skip the seed server as we already have a connection to it.
	filteredAddresses := make([]string, 0, len(serverAddresses))
	for _, addr := range serverAddresses {
		p.connectionLock.RLock()
		_, exists := p.addressToConnection[addr]
		p.connectionLock.RUnlock()
		if !exists {
			filteredAddresses = append(filteredAddresses, addr)
		}
	}

	// Initialize connections to all other servers.
	errors := p.initializeConnections(ctx, filteredAddresses)

	// Return all found addresses, not just the ones we connected to.
	return serverAddresses, errors
}
