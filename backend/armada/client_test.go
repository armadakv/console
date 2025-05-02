// Package armada provides a client for interacting with the Armada KV database server.
package armada

import (
	"context"
	"net"
	"testing"
	"time"

	regattapb "github.com/armadakv/console/backend/armada/pb"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/test/bufconn"
)

const bufSize = 1024 * 1024

var lis *bufconn.Listener

// mockServer implements the gRPC server interfaces for testing
type mockServer struct {
	regattapb.UnimplementedKVServer
	regattapb.UnimplementedClusterServer
	regattapb.UnimplementedTablesServer
}

// Status implements the Status method of the ClusterServer interface
func (s *mockServer) Status(ctx context.Context, req *regattapb.StatusRequest) (*regattapb.StatusResponse, error) {
	// Return a mock status response
	return &regattapb.StatusResponse{
		Id:      "node1",
		Version: "v1.0.0",
		Info:    "Mock Armada Server",
		Tables: map[string]*regattapb.TableStatus{
			"test": {
				LogSize:          1024,
				DbSize:           2048,
				Leader:           "node1",
				RaftIndex:        100,
				RaftTerm:         5,
				RaftAppliedIndex: 95,
			},
		},
	}, nil
}

// MemberList implements the MemberList method of the ClusterServer interface
func (s *mockServer) MemberList(ctx context.Context, req *regattapb.MemberListRequest) (*regattapb.MemberListResponse, error) {
	// Return a mock member list response
	return &regattapb.MemberListResponse{
		Cluster: "test-cluster",
		Members: []*regattapb.Member{
			{
				Id:         "node1",
				Name:       "node1",
				PeerURLs:   []string{"localhost:8081"},
				ClientURLs: []string{"localhost:8081"},
			},
			{
				Id:         "node2",
				Name:       "node2",
				PeerURLs:   []string{"localhost:8082"},
				ClientURLs: []string{"localhost:8082"},
			},
			{
				Id:         "node3",
				Name:       "node3",
				PeerURLs:   []string{"localhost:8083"},
				ClientURLs: []string{"localhost:8083"},
			},
		},
	}, nil
}

// Range implements the Range method of the KVServer interface
func (s *mockServer) Range(ctx context.Context, req *regattapb.RangeRequest) (*regattapb.RangeResponse, error) {
	// Return a mock range response
	return &regattapb.RangeResponse{
		Header: &regattapb.ResponseHeader{
			ShardId:      1,
			ReplicaId:    1,
			Revision:     100,
			RaftTerm:     5,
			RaftLeaderId: 1,
		},
		Kvs: []*regattapb.KeyValue{
			{
				Key:            []byte("key1"),
				CreateRevision: 1,
				ModRevision:    1,
				Value:          []byte("value1"),
			},
			{
				Key:            []byte("key2"),
				CreateRevision: 2,
				ModRevision:    2,
				Value:          []byte("value2"),
			},
		},
		More:  false,
		Count: 2,
	}, nil
}

// Put implements the Put method of the KVServer interface
func (s *mockServer) Put(ctx context.Context, req *regattapb.PutRequest) (*regattapb.PutResponse, error) {
	// Return a mock put response
	return &regattapb.PutResponse{
		Header: &regattapb.ResponseHeader{
			ShardId:      1,
			ReplicaId:    1,
			Revision:     101,
			RaftTerm:     5,
			RaftLeaderId: 1,
		},
	}, nil
}

// DeleteRange implements the DeleteRange method of the KVServer interface
func (s *mockServer) DeleteRange(ctx context.Context, req *regattapb.DeleteRangeRequest) (*regattapb.DeleteRangeResponse, error) {
	// Return a mock delete range response
	return &regattapb.DeleteRangeResponse{
		Header: &regattapb.ResponseHeader{
			ShardId:      1,
			ReplicaId:    1,
			Revision:     102,
			RaftTerm:     5,
			RaftLeaderId: 1,
		},
		Deleted: 1,
	}, nil
}

// List implements the List method of the TablesServer interface
func (s *mockServer) List(ctx context.Context, req *regattapb.ListTablesRequest) (*regattapb.ListTablesResponse, error) {
	// Return a mock list tables response
	return &regattapb.ListTablesResponse{
		Tables: []*regattapb.TableInfo{
			{
				Name: "test_table1",
				Id:   "table1",
			},
			{
				Name: "test_table2",
				Id:   "table2",
			},
		},
	}, nil
}

// bufDialer is a helper function for creating a gRPC connection to the mock server
func bufDialer(context.Context, string) (net.Conn, error) {
	return lis.Dial()
}

// setupTest sets up the mock gRPC server and returns a client for testing
func setupTest(t *testing.T) (ArmadaClient, func()) {
	// Create a buffer listener
	lis = bufconn.Listen(bufSize)

	// Create a gRPC server
	s := grpc.NewServer()

	// Register the mock server implementations
	mockSrv := &mockServer{}
	regattapb.RegisterKVServer(s, mockSrv)
	regattapb.RegisterClusterServer(s, mockSrv)
	regattapb.RegisterTablesServer(s, mockSrv)

	// Start the server
	go func() {
		if err := s.Serve(lis); err != nil {
			t.Fatalf("Failed to serve: %v", err)
		}
	}()

	// Create a client connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	conn, err := grpc.DialContext(ctx, "bufnet", grpc.WithContextDialer(bufDialer), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatalf("Failed to dial bufnet: %v", err)
	}

	// Create a no-op logger for testing
	logger := zap.NewNop()

	// Create the client
	client := &client{
		address:           "bufnet",
		conn:              conn,
		kvClient:          regattapb.NewKVClient(conn),
		clusterClient:     regattapb.NewClusterClient(conn),
		tablesClient:      regattapb.NewTablesClient(conn),
		logger:            logger,
		serverConnections: make(map[string]*grpc.ClientConn),
	}

	// Return the client and a cleanup function
	return client, func() {
		conn.Close()
		s.Stop()
	}
}

// TestGetStatus tests the GetStatus method
func TestGetStatus(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	status, err := client.GetStatus(ctx, "")

	// Check for errors
	if err != nil {
		t.Fatalf("GetStatus failed: %v", err)
	}

	// Check the response
	if status.Status != "ok" {
		t.Errorf("Expected status 'ok', got '%s'", status.Status)
	}

	if status.Message != "v1.0.0 - Mock Armada Server" {
		t.Errorf("Expected message 'v1.0.0 - Mock Armada Server', got '%s'", status.Message)
	}
}

// TestGetStatusWithServerAddress tests the GetStatus method with a specific server address
func TestGetStatusWithServerAddress(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	status, err := client.GetStatus(ctx, "bufnet")

	// Check for errors
	if err != nil {
		t.Fatalf("GetStatus with server address failed: %v", err)
	}

	// Check the response
	if status.Status != "ok" {
		t.Errorf("Expected status 'ok', got '%s'", status.Status)
	}

	if status.Message != "v1.0.0 - Mock Armada Server" {
		t.Errorf("Expected message 'v1.0.0 - Mock Armada Server', got '%s'", status.Message)
	}
}

// TestGetClusterInfo tests the GetClusterInfo method
func TestGetClusterInfo(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	clusterInfo, err := client.GetClusterInfo(ctx)

	// Check for errors
	if err != nil {
		t.Fatalf("GetClusterInfo failed: %v", err)
	}

	// Check the response
	if clusterInfo.NodeID != "node1" {
		t.Errorf("Expected nodeId 'node1', got '%s'", clusterInfo.NodeID)
	}

	if clusterInfo.Leader != "node1" {
		t.Errorf("Expected leader 'node1', got '%s'", clusterInfo.Leader)
	}

	if len(clusterInfo.Followers) != 2 {
		t.Errorf("Expected 2 followers, got %d", len(clusterInfo.Followers))
	}

	if clusterInfo.Term != 5 {
		t.Errorf("Expected term 5, got %d", clusterInfo.Term)
	}
}

// TestGetAllServers tests the GetAllServers method
func TestGetAllServers(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	servers, err := client.GetAllServers(ctx)

	// Check for errors
	if err != nil {
		t.Fatalf("GetAllServers failed: %v", err)
	}

	// Check the response
	if len(servers) != 3 {
		t.Errorf("Expected 3 servers, got %d", len(servers))
	}

	// Check the first server
	if servers[0].ID != "node1" {
		t.Errorf("Expected server ID 'node1', got '%s'", servers[0].ID)
	}

	if servers[0].Name != "node1" {
		t.Errorf("Expected server Name 'node1', got '%s'", servers[0].Name)
	}

	if len(servers[0].ClientURLs) != 1 || servers[0].ClientURLs[0] != "localhost:8081" {
		t.Errorf("Expected ClientURLs ['localhost:8081'], got %v", servers[0].ClientURLs)
	}
}

// TestGetMetrics tests the GetMetrics method
func TestGetMetrics(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	metrics, err := client.GetMetrics(ctx)

	// Check for errors
	if err != nil {
		t.Fatalf("GetMetrics failed: %v", err)
	}

	// Check the response
	if metrics.KeyCount != 100 {
		t.Errorf("Expected keyCount 100, got %d", metrics.KeyCount)
	}

	if metrics.DiskUsage != 3072 { // 1024 + 2048
		t.Errorf("Expected diskUsage 3072, got %d", metrics.DiskUsage)
	}
}

// TestGetTables tests the GetTables method
func TestGetTables(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	tables, err := client.GetTables(ctx)

	// Check for errors
	if err != nil {
		t.Fatalf("GetTables failed: %v", err)
	}

	// Check the response
	if len(tables) != 2 {
		t.Errorf("Expected 2 tables, got %d", len(tables))
	}

	if tables[0].Name != "test_table1" || tables[0].ID != "table1" {
		t.Errorf("Expected table {test_table1, table1}, got {%s, %s}", tables[0].Name, tables[0].ID)
	}

	if tables[1].Name != "test_table2" || tables[1].ID != "table2" {
		t.Errorf("Expected table {test_table2, table2}, got {%s, %s}", tables[1].Name, tables[1].ID)
	}
}

// TestGetKeyValuePairs tests the GetKeyValuePairs method
func TestGetKeyValuePairs(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	pairs, err := client.GetKeyValuePairs(ctx, "test_table", "key", 10)

	// Check for errors
	if err != nil {
		t.Fatalf("GetKeyValuePairs failed: %v", err)
	}

	// Check the response
	if len(pairs) != 2 {
		t.Errorf("Expected 2 pairs, got %d", len(pairs))
	}

	if pairs[0].Key != "key1" || pairs[0].Value != "value1" {
		t.Errorf("Expected pair {key1, value1}, got {%s, %s}", pairs[0].Key, pairs[0].Value)
	}

	if pairs[1].Key != "key2" || pairs[1].Value != "value2" {
		t.Errorf("Expected pair {key2, value2}, got {%s, %s}", pairs[1].Key, pairs[1].Value)
	}
}

// TestPutKeyValue tests the PutKeyValue method
func TestPutKeyValue(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	err := client.PutKeyValue(ctx, "test_table", "key3", "value3")

	// Check for errors
	if err != nil {
		t.Fatalf("PutKeyValue failed: %v", err)
	}
}

// TestDeleteKey tests the DeleteKey method
func TestDeleteKey(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	err := client.DeleteKey(ctx, "test_table", "key1")

	// Check for errors
	if err != nil {
		t.Fatalf("DeleteKey failed: %v", err)
	}
}

// TestClose tests the Close method
func TestClose(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	err := client.Close()

	// Check for errors
	if err != nil {
		t.Fatalf("Close failed: %v", err)
	}
}
