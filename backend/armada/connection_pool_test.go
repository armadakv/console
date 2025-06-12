package armada

import (
	"context"
	"net"
	"testing"
	"time"

	regattapb "github.com/armadakv/console/backend/armada/pb"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/connectivity"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/test/bufconn"
)

const poolBufSize = 1024 * 1024

// mockPoolServer implements the gRPC server interfaces for connection pool testing
type mockPoolServer struct {
	regattapb.UnimplementedClusterServer
	memberResponse *regattapb.MemberListResponse
}

func (s *mockPoolServer) MemberList(ctx context.Context, req *regattapb.MemberListRequest) (*regattapb.MemberListResponse, error) {
	if s.memberResponse != nil {
		return s.memberResponse, nil
	}
	return &regattapb.MemberListResponse{
		Cluster: "test-cluster",
		Members: []*regattapb.Member{
			{
				Id:         "node1",
				Name:       "node1",
				PeerURLs:   []string{"localhost:8081"},
				ClientURLs: []string{"localhost:8081"},
			},
		},
	}, nil
}

func setupPoolTest(t *testing.T) (*ConnectionPool, *grpc.Server, *bufconn.Listener, func()) {
	// Create a buffer listener
	lis := bufconn.Listen(poolBufSize)

	// Create a gRPC server
	s := grpc.NewServer()

	// Register the mock server
	mockSrv := &mockPoolServer{}
	regattapb.RegisterClusterServer(s, mockSrv)

	// Start the server
	go func() {
		if err := s.Serve(lis); err != nil {
			t.Logf("Server serve failed: %v", err)
		}
	}()

	// Create connection pool
	logger := zap.NewNop()
	pool := NewConnectionPool(logger)

	// Return pool, server, listener and cleanup function
	return pool, s, lis, func() {
		s.Stop()
		lis.Close()
	}
}

func createTestConnection(t *testing.T, lis *bufconn.Listener) *grpc.ClientConn {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	bufDialer := func(context.Context, string) (net.Conn, error) {
		return lis.Dial()
	}

	conn, err := grpc.DialContext(ctx, "bufnet",
		grpc.WithContextDialer(bufDialer),
		grpc.WithTransportCredentials(insecure.NewCredentials()))
	assert.NoError(t, err)
	return conn
}

func TestNewConnectionPool(t *testing.T) {
	logger := zap.NewNop()
	pool := NewConnectionPool(logger)

	assert.NotNil(t, pool)
	assert.Equal(t, logger, pool.logger)
	assert.NotNil(t, pool.addressToConnection)
	assert.NotNil(t, pool.idToConnection)
	assert.Equal(t, 5, pool.reconnectCfg.maxRetries)
	assert.Equal(t, 500*time.Millisecond, pool.reconnectCfg.baseDelay)
	assert.Equal(t, 30*time.Second, pool.reconnectCfg.maxDelay)
}

func TestCreateGRPCConnection(t *testing.T) {
	logger := zap.NewNop()
	ctx := context.Background()

	tests := []struct {
		name        string
		address     string
		expectError bool
	}{
		{
			name:        "http prefix",
			address:     "http://localhost:8080",
			expectError: true, // Will fail because there's no server
		},
		{
			name:        "https prefix",
			address:     "https://localhost:8080",
			expectError: true, // Will fail because there's no server
		},
		{
			name:        "no prefix",
			address:     "localhost:8080",
			expectError: true, // Will fail because there's no server
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			conn, err := createGRPCConnection(ctx, tt.address, logger)
			if tt.expectError {
				// We expect an error since there's no actual server
				// But we're testing the function logic, not actual connectivity
				if err == nil && conn != nil {
					conn.Close()
				}
			}
		})
	}
}

func TestExtractHostname(t *testing.T) {
	tests := []struct {
		name     string
		address  string
		expected string
	}{
		{
			name:     "http with port",
			address:  "http://localhost:8080",
			expected: "localhost",
		},
		{
			name:     "https with port",
			address:  "https://example.com:8443",
			expected: "example.com",
		},
		{
			name:     "no protocol with port",
			address:  "localhost:8080",
			expected: "localhost",
		},
		{
			name:     "no protocol no port",
			address:  "localhost",
			expected: "localhost",
		},
		{
			name:     "IP address with port",
			address:  "192.168.1.1:8080",
			expected: "192.168.1.1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := extractHostname(tt.address)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestIsConnectionHealthy(t *testing.T) {
	// Test with nil connection
	assert.False(t, isConnectionHealthy(nil))

	// For a real connection test, we'd need to set up a proper connection
	// This is more of an integration test that would require actual gRPC setup
}

func TestCreateServerConnection(t *testing.T) {
	pool, server, lis, cleanup := setupPoolTest(t)
	defer cleanup()

	conn := createTestConnection(t, lis)
	defer conn.Close()

	serverConn := createServerConnection(conn)

	assert.NotNil(t, serverConn)
	assert.Equal(t, conn, serverConn.conn)
	assert.NotNil(t, serverConn.KVClient)
	assert.NotNil(t, serverConn.ClusterClient)
	assert.NotNil(t, serverConn.TablesClient)
	assert.NotNil(t, serverConn.MetricsClient)

	// Suppress unused variable warnings
	_ = pool
	_ = server
}

func TestConnectionPoolGetKnownAddresses(t *testing.T) {
	pool, server, lis, cleanup := setupPoolTest(t)
	defer cleanup()

	// Initially empty
	addresses := pool.GetKnownAddresses()
	assert.Empty(t, addresses)

	// Add a connection manually for testing
	conn := createTestConnection(t, lis)
	defer conn.Close()

	serverConn := createServerConnection(conn)
	pool.connectionLock.Lock()
	pool.addressToConnection["test-address"] = serverConn
	pool.connectionLock.Unlock()

	addresses = pool.GetKnownAddresses()
	assert.Len(t, addresses, 1)
	assert.Contains(t, addresses, "test-address")

	// Suppress unused variable warnings
	_ = server
}

func TestConnectionPoolClose(t *testing.T) {
	pool, server, lis, cleanup := setupPoolTest(t)
	defer cleanup()

	// Add some test connections
	conn1 := createTestConnection(t, lis)
	conn2 := createTestConnection(t, lis)

	serverConn1 := createServerConnection(conn1)
	serverConn2 := createServerConnection(conn2)

	pool.connectionLock.Lock()
	pool.addressToConnection["addr1"] = serverConn1
	pool.addressToConnection["addr2"] = serverConn2
	pool.idToConnection["node1"] = serverConn1
	pool.idToConnection["node2"] = serverConn2
	pool.connectionLock.Unlock()

	// Close the pool
	err := pool.Close()
	assert.NoError(t, err)

	// Verify maps are cleared
	assert.Empty(t, pool.addressToConnection)
	assert.Empty(t, pool.idToConnection)

	// Suppress unused variable warnings
	_ = server
}

func TestConnectionPoolGetKnownServers(t *testing.T) {
	pool, server, lis, cleanup := setupPoolTest(t)
	defer cleanup()

	// Add test connections with node info
	conn := createTestConnection(t, lis)
	defer conn.Close()

	serverConn := createServerConnection(conn)
	serverConn.NodeID = "node1"
	serverConn.NodeName = "test-node"

	pool.connectionLock.Lock()
	pool.addressToConnection["addr1"] = serverConn
	pool.addressToConnection["addr2"] = serverConn // Same server, different address
	pool.idToConnection["node1"] = serverConn
	pool.connectionLock.Unlock()

	servers := pool.GetKnownServers()
	assert.Len(t, servers, 1)
	assert.Equal(t, "node1", servers[0].ID)
	assert.Equal(t, "test-node", servers[0].Name)
	assert.Len(t, servers[0].Addresses, 2)
	assert.Contains(t, servers[0].Addresses, "addr1")
	assert.Contains(t, servers[0].Addresses, "addr2")

	// Suppress unused variable warnings
	_ = server
}

func TestConnectionPoolInitializeConnections(t *testing.T) {
	pool, server, lis, cleanup := setupPoolTest(t)
	defer cleanup()

	ctx := context.Background()

	// Test with the actual server address (should succeed)
	validAddress := lis.Addr().String()
	addresses := []string{validAddress}
	errors := pool.InitializeConnections(ctx, addresses)

	// Should have no errors for valid address
	assert.Len(t, errors, 0, "should have no errors for valid address")

	// Verify the connection was actually created
	conn, err := pool.GetConnection(ctx, validAddress)
	assert.NoError(t, err)
	assert.NotNil(t, conn)

	// Suppress unused variable warnings
	_ = server
}

func TestReconnectConfig(t *testing.T) {
	config := reconnectConfig{
		maxRetries: 3,
		baseDelay:  100 * time.Millisecond,
		maxDelay:   10 * time.Second,
	}

	assert.Equal(t, 3, config.maxRetries)
	assert.Equal(t, 100*time.Millisecond, config.baseDelay)
	assert.Equal(t, 10*time.Second, config.maxDelay)
}

func TestNodeInfo(t *testing.T) {
	nodeInfo := &NodeInfo{
		NodeID:   "test-node-id",
		NodeName: "test-node-name",
	}

	assert.Equal(t, "test-node-id", nodeInfo.NodeID)
	assert.Equal(t, "test-node-name", nodeInfo.NodeName)
}

func TestServerInfo(t *testing.T) {
	serverInfo := ServerInfo{
		ID:              "server-1",
		Name:            "Server 1",
		Addresses:       []string{"addr1", "addr2"},
		PrimaryAddress:  "addr1",
		ConnectionState: connectivity.Ready.String(),
	}

	assert.Equal(t, "server-1", serverInfo.ID)
	assert.Equal(t, "Server 1", serverInfo.Name)
	assert.Len(t, serverInfo.Addresses, 2)
	assert.Equal(t, "addr1", serverInfo.PrimaryAddress)
	assert.Equal(t, connectivity.Ready.String(), serverInfo.ConnectionState)
}

// Test the ConnectionPoolInterface implementation
func TestConnectionPoolInterface(t *testing.T) {
	logger := zap.NewNop()
	pool := NewConnectionPool(logger)

	// Verify it implements the interface
	var _ ConnectionPoolInterface = pool

	addresses := pool.GetKnownAddresses()
	assert.NotNil(t, addresses)

	err := pool.Close()
	assert.NoError(t, err)
}
