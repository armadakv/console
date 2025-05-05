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

	// connections is a cache of connections to servers in the cluster
	// The key is the server address, and the value is the connection info
	connections     map[string]*ServerConnection
	connectionsLock sync.Mutex

	// reconnectCfg holds configuration for reconnection attempts
	reconnectCfg reconnectConfig
}

// ServerConnection holds a gRPC connection and its associated clients
type ServerConnection struct {
	// conn is the gRPC connection to the server
	conn *grpc.ClientConn

	// kvClient is the gRPC client for key-value operations
	kvClient regattapb.KVClient

	// clusterClient is the gRPC client for cluster operations
	clusterClient regattapb.ClusterClient

	// tablesClient is the gRPC client for table operations
	tablesClient regattapb.TablesClient
}

// NewConnectionPool creates a new connection pool with default reconnect configuration
func NewConnectionPool(logger *zap.Logger) *ConnectionPool {
	pool := &ConnectionPool{
		logger:      logger,
		connections: make(map[string]*ServerConnection),
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

// GetConnection gets or creates a gRPC connection to the specified server address.
// It validates the connection health and attempts to reconnect if needed.
//
// Parameters:
//   - ctx: The context for the operation.
//   - serverAddress: The address of the server to connect to.
//
// Returns:
//   - The server connection containing gRPC connection and clients.
//   - An error if the connection could not be established.
func (p *ConnectionPool) GetConnection(ctx context.Context, serverAddress string) (*ServerConnection, error) {
	// Check if we already have a connection to this server
	p.connectionsLock.Lock()
	defer p.connectionsLock.Unlock()
	serverConn, exists := p.connections[serverAddress]

	if exists {
		p.logger.Debug("Using cached connection to server", zap.String("address", serverAddress))

		// Validate connection health
		if serverConn.conn != nil && (serverConn.conn.GetState() == connectivity.Ready || serverConn.conn.GetState() == connectivity.Idle) {
			return serverConn, nil
		}

		// Connection exists but needs reconnection
		newConn, err := p.reconnectServer(ctx, serverAddress, serverConn.conn)
		if err != nil {
			// Remove the broken connection from cache
			delete(p.connections, serverAddress)
			return nil, err
		}

		// Create clients
		serverConn = &ServerConnection{
			conn:          newConn,
			kvClient:      regattapb.NewKVClient(newConn),
			clusterClient: regattapb.NewClusterClient(newConn),
			tablesClient:  regattapb.NewTablesClient(newConn),
		}

		p.connections[serverAddress] = serverConn
		return serverConn, nil
	}

	// Create a new connection
	conn, err := createGRPCConnection(ctx, serverAddress, p.logger)
	if err != nil {
		return nil, err
	}

	// Create clients
	serverConn = &ServerConnection{
		conn:          conn,
		kvClient:      regattapb.NewKVClient(conn),
		clusterClient: regattapb.NewClusterClient(conn),
		tablesClient:  regattapb.NewTablesClient(conn),
	}

	// Cache the connection
	p.connections[serverAddress] = serverConn
	return serverConn, nil
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
	p.connectionsLock.Lock()
	defer p.connectionsLock.Unlock()

	var lastErr error
	for address, serverConn := range p.connections {
		p.logger.Debug("Closing connection", zap.String("address", address))
		if serverConn.conn != nil {
			if err := serverConn.conn.Close(); err != nil {
				p.logger.Error("Failed to close connection",
					zap.String("address", address),
					zap.Error(err))
				lastErr = err
			}
		}
	}

	// Clear the map
	p.connections = make(map[string]*ServerConnection)
	return lastErr
}
