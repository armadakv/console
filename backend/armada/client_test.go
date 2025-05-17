// Package armada provides a client for interacting with the Armada KV database server.
package armada

import (
	"context"
	"net"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

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

// Create implements the Create method of the TablesServer interface
func (s *mockServer) Create(ctx context.Context, req *regattapb.CreateTableRequest) (*regattapb.CreateTableResponse, error) {
	// Return a mock create table response
	return &regattapb.CreateTableResponse{
		Id: "table_" + req.Name,
	}, nil
}

// Delete implements the Delete method of the TablesServer interface
func (s *mockServer) Delete(ctx context.Context, req *regattapb.DeleteTableRequest) (*regattapb.DeleteTableResponse, error) {
	// Return a mock delete table response
	return &regattapb.DeleteTableResponse{}, nil
}

type mockConnectionPool struct {
	mock.Mock
}

func (m *mockConnectionPool) GetConnection(ctx context.Context, serverAddress string) (*ServerConnection, error) {
	args := m.Called(ctx, serverAddress)
	return args.Get(0).(*ServerConnection), args.Error(1)
}

func (m *mockConnectionPool) GetKnownAddresses() []string {
	args := m.Called()
	return args.Get(0).([]string)
}

func (m *mockConnectionPool) Close() error {
	args := m.Called()
	return args.Error(0)
}

// bufDialer is a helper function for creating a gRPC connection to the mock server
func bufDialer(context.Context, string) (net.Conn, error) {
	return lis.Dial()
}

// setupTest sets up the mock gRPC server and returns a client for testing
func setupTest(t *testing.T) (*Client, func()) {
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

	mp := &mockConnectionPool{}
	mp.On("GetConnection", mock.Anything, mock.Anything).Return(createServerConnection(conn), nil)
	mp.On("Close").Return(nil)
	// Create a no-op logger for testing
	logger := zap.NewNop()

	// Create the client
	client := &Client{
		address:        "bufnet",
		logger:         logger,
		connectionPool: mp,
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

	// Check for errors and response using testify/assert
	assert.NoError(t, err, "GetStatus should not return an error")
	assert.Equal(t, "ok", status.Status, "Status should be 'ok'")
	assert.Equal(t, "v1.0.0 - Mock Armada Server", status.Message,
		"Message should be 'v1.0.0 - Mock Armada Server'")
}

// TestGetStatusWithServerAddress tests the GetStatus method with a specific server address
func TestGetStatusWithServerAddress(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	status, err := client.GetStatus(ctx, "bufnet")

	// Check for errors and response using testify/assert
	assert.NoError(t, err, "GetStatus with server address should not return an error")
	assert.Equal(t, "ok", status.Status, "Status should be 'ok'")
	assert.Equal(t, "v1.0.0 - Mock Armada Server", status.Message,
		"Message should be 'v1.0.0 - Mock Armada Server'")
}

// TestGetClusterInfo tests the GetClusterInfo method
func TestGetClusterInfo(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	info, err := client.GetClusterInfo(ctx)

	// Check for errors and response using testify/assert
	assert.NoError(t, err, "GetClusterInfo should not return an error")
	assert.NotNil(t, info, "Cluster info should not be nil")
}

// TestGetAllServers tests the GetAllServers method
func TestGetAllServers(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	servers, err := client.GetAllServers(ctx)

	// Check for errors and response using testify/assert
	assert.NoError(t, err, "GetAllServers should not return an error")
	assert.Len(t, servers, 3, "Should return 3 servers")

	// Check the first server
	assert.Equal(t, "node1", servers[0].ID, "Server ID should be 'node1'")
	assert.Equal(t, "node1", servers[0].Name, "Server Name should be 'node1'")
	assert.Len(t, servers[0].ClientURLs, 1, "Should have 1 client URL")
	assert.Equal(t, "localhost:8081", servers[0].ClientURLs[0],
		"Client URL should be 'localhost:8081'")
}

// TestGetTables tests the GetTables method
func TestGetTables(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	tables, err := client.GetTables(ctx)

	// Check for errors and response using testify/assert
	assert.NoError(t, err, "GetTables should not return an error")
	assert.Len(t, tables, 2, "Should return 2 tables")

	assert.Equal(t, "test_table1", tables[0].Name, "First table name should be 'test_table1'")
	assert.Equal(t, "table1", tables[0].ID, "First table ID should be 'table1'")
	assert.Equal(t, "test_table2", tables[1].Name, "Second table name should be 'test_table2'")
	assert.Equal(t, "table2", tables[1].ID, "Second table ID should be 'table2'")
}

// TestGetKeyValuePairs tests the GetKeyValuePairs method
func TestGetKeyValuePairs(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	pairs, err := client.GetKeyValuePairs(ctx, "test_table", "key", "", "", 10)

	// Check for errors and response using testify/assert
	assert.NoError(t, err, "GetKeyValuePairs should not return an error")
	assert.Len(t, pairs, 2, "Should return 2 pairs")

	assert.Equal(t, "key1", pairs[0].Key, "First key should be 'key1'")
	assert.Equal(t, "value1", pairs[0].Value, "First value should be 'value1'")
	assert.Equal(t, "key2", pairs[1].Key, "Second key should be 'key2'")
	assert.Equal(t, "value2", pairs[1].Value, "Second value should be 'value2'")
}

// TestGetKeyValue tests the GetKeyValue method
func TestGetKeyValue(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	pair, err := client.GetKeyValue(ctx, "test_table", "key1")

	// Check for errors and response using testify/assert
	assert.NoError(t, err, "GetKeyValue should not return an error")
	assert.Equal(t, "key1", pair.Key, "Key should be 'key1'")
	assert.Equal(t, "value1", pair.Value, "Value should be 'value1'")
}

// TestPutKeyValue tests the PutKeyValue method
func TestPutKeyValue(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	err := client.PutKeyValue(ctx, "test_table", "key3", "value3")

	// Check for errors using testify/assert
	assert.NoError(t, err, "PutKeyValue should not return an error")
}

// TestDeleteKey tests the DeleteKey method
func TestDeleteKey(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	err := client.DeleteKey(ctx, "test_table", "key1")

	// Check for errors using testify/assert
	assert.NoError(t, err, "DeleteKey should not return an error")
}

// TestCreateTable tests the CreateTable method
func TestCreateTable(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	tableID, err := client.CreateTable(ctx, "new_table")

	// Check for errors and response using testify/assert
	assert.NoError(t, err, "CreateTable should not return an error")
	assert.Equal(t, "table_new_table", tableID, "Table ID should be 'table_new_table'")
}

// TestDeleteTable tests the DeleteTable method
func TestDeleteTable(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	ctx := context.Background()
	err := client.DeleteTable(ctx, "test_table")

	// Check for errors using testify/assert
	assert.NoError(t, err, "DeleteTable should not return an error")
}

// TestClose tests the Close method
func TestClose(t *testing.T) {
	// Set up the test
	client, cleanup := setupTest(t)
	defer cleanup()

	// Call the method
	err := client.Close()

	// Check for errors using testify/assert
	assert.NoError(t, err, "Close should not return an error")
}
