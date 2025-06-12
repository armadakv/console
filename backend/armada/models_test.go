package armada

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestStatus(t *testing.T) {
	status := Status{
		Status:  "ok",
		Message: "Server is running",
		Config: map[string]interface{}{
			"key1": "value1",
			"key2": 123,
		},
		Tables: map[string]TableStatus{
			"table1": {
				LogSize:          1024,
				DBSize:           2048,
				Leader:           "node1",
				RaftIndex:        100,
				RaftTerm:         5,
				RaftAppliedIndex: 95,
			},
		},
		Errors: []string{"error1", "error2"},
	}

	assert.Equal(t, "ok", status.Status)
	assert.Equal(t, "Server is running", status.Message)
	assert.Len(t, status.Config, 2)
	assert.Equal(t, "value1", status.Config["key1"])
	assert.Equal(t, 123, status.Config["key2"])
	assert.Len(t, status.Tables, 1)
	assert.Contains(t, status.Tables, "table1")
	assert.Len(t, status.Errors, 2)
	assert.Contains(t, status.Errors, "error1")
	assert.Contains(t, status.Errors, "error2")
}

func TestStatusJSONSerialization(t *testing.T) {
	status := Status{
		Status:  "ok",
		Message: "Test message",
		Config: map[string]interface{}{
			"test": "value",
		},
		Tables: map[string]TableStatus{
			"test_table": {
				LogSize:          512,
				DBSize:           1024,
				Leader:           "leader1",
				RaftIndex:        50,
				RaftTerm:         3,
				RaftAppliedIndex: 48,
			},
		},
		Errors: []string{"test error"},
	}

	// Test marshaling
	data, err := json.Marshal(status)
	assert.NoError(t, err)
	assert.Contains(t, string(data), `"status":"ok"`)
	assert.Contains(t, string(data), `"message":"Test message"`)

	// Test unmarshaling
	var unmarshaled Status
	err = json.Unmarshal(data, &unmarshaled)
	assert.NoError(t, err)
	assert.Equal(t, status.Status, unmarshaled.Status)
	assert.Equal(t, status.Message, unmarshaled.Message)
	assert.Equal(t, status.Config["test"], unmarshaled.Config["test"])
	assert.Len(t, unmarshaled.Tables, 1)
	assert.Len(t, unmarshaled.Errors, 1)
}

func TestTableStatus(t *testing.T) {
	tableStatus := TableStatus{
		LogSize:          1024,
		DBSize:           2048,
		Leader:           "node1",
		RaftIndex:        100,
		RaftTerm:         5,
		RaftAppliedIndex: 95,
	}

	assert.Equal(t, int64(1024), tableStatus.LogSize)
	assert.Equal(t, int64(2048), tableStatus.DBSize)
	assert.Equal(t, "node1", tableStatus.Leader)
	assert.Equal(t, uint64(100), tableStatus.RaftIndex)
	assert.Equal(t, uint64(5), tableStatus.RaftTerm)
	assert.Equal(t, uint64(95), tableStatus.RaftAppliedIndex)
}

func TestTableStatusJSONSerialization(t *testing.T) {
	tableStatus := TableStatus{
		LogSize:          512,
		DBSize:           1024,
		Leader:           "leader1",
		RaftIndex:        50,
		RaftTerm:         3,
		RaftAppliedIndex: 48,
	}

	// Test marshaling
	data, err := json.Marshal(tableStatus)
	assert.NoError(t, err)
	assert.Contains(t, string(data), `"logSize":512`)
	assert.Contains(t, string(data), `"dbSize":1024`)
	assert.Contains(t, string(data), `"leader":"leader1"`)

	// Test unmarshaling
	var unmarshaled TableStatus
	err = json.Unmarshal(data, &unmarshaled)
	assert.NoError(t, err)
	assert.Equal(t, tableStatus.LogSize, unmarshaled.LogSize)
	assert.Equal(t, tableStatus.DBSize, unmarshaled.DBSize)
	assert.Equal(t, tableStatus.Leader, unmarshaled.Leader)
	assert.Equal(t, tableStatus.RaftIndex, unmarshaled.RaftIndex)
	assert.Equal(t, tableStatus.RaftTerm, unmarshaled.RaftTerm)
	assert.Equal(t, tableStatus.RaftAppliedIndex, unmarshaled.RaftAppliedIndex)
}

func TestClusterInfo(t *testing.T) {
	clusterInfo := ClusterInfo{
		NodeID:      "node1",
		NodeAddress: "localhost:8081",
		Members: []Server{
			{
				ID:         "server1",
				Name:       "Server 1",
				PeerURLs:   []string{"peer1", "peer2"},
				ClientURLs: []string{"client1", "client2"},
			},
		},
	}

	assert.Equal(t, "node1", clusterInfo.NodeID)
	assert.Equal(t, "localhost:8081", clusterInfo.NodeAddress)
	assert.Len(t, clusterInfo.Members, 1)
	assert.Equal(t, "server1", clusterInfo.Members[0].ID)
}

func TestClusterInfoJSONSerialization(t *testing.T) {
	clusterInfo := ClusterInfo{
		NodeID:      "test-node",
		NodeAddress: "test-address",
		Members: []Server{
			{
				ID:         "server1",
				Name:       "Test Server",
				PeerURLs:   []string{"peer1"},
				ClientURLs: []string{"client1"},
			},
		},
	}

	// Test marshaling
	data, err := json.Marshal(clusterInfo)
	assert.NoError(t, err)
	assert.Contains(t, string(data), `"nodeId":"test-node"`)
	assert.Contains(t, string(data), `"nodeAddress":"test-address"`)

	// Test unmarshaling
	var unmarshaled ClusterInfo
	err = json.Unmarshal(data, &unmarshaled)
	assert.NoError(t, err)
	assert.Equal(t, clusterInfo.NodeID, unmarshaled.NodeID)
	assert.Equal(t, clusterInfo.NodeAddress, unmarshaled.NodeAddress)
	assert.Len(t, unmarshaled.Members, 1)
	assert.Equal(t, clusterInfo.Members[0].ID, unmarshaled.Members[0].ID)
}

func TestKeyValuePair(t *testing.T) {
	kvp := KeyValuePair{
		Key:   "test-key",
		Value: "test-value",
	}

	assert.Equal(t, "test-key", kvp.Key)
	assert.Equal(t, "test-value", kvp.Value)
}

func TestKeyValuePairJSONSerialization(t *testing.T) {
	kvp := KeyValuePair{
		Key:   "json-key",
		Value: "json-value",
	}

	// Test marshaling
	data, err := json.Marshal(kvp)
	assert.NoError(t, err)
	assert.Contains(t, string(data), `"key":"json-key"`)
	assert.Contains(t, string(data), `"value":"json-value"`)

	// Test unmarshaling
	var unmarshaled KeyValuePair
	err = json.Unmarshal(data, &unmarshaled)
	assert.NoError(t, err)
	assert.Equal(t, kvp.Key, unmarshaled.Key)
	assert.Equal(t, kvp.Value, unmarshaled.Value)
}

func TestTable(t *testing.T) {
	table := Table{
		Name: "test-table",
		ID:   "table-123",
	}

	assert.Equal(t, "test-table", table.Name)
	assert.Equal(t, "table-123", table.ID)
}

func TestTableJSONSerialization(t *testing.T) {
	table := Table{
		Name: "json-table",
		ID:   "json-123",
	}

	// Test marshaling
	data, err := json.Marshal(table)
	assert.NoError(t, err)
	assert.Contains(t, string(data), `"name":"json-table"`)
	assert.Contains(t, string(data), `"id":"json-123"`)

	// Test unmarshaling
	var unmarshaled Table
	err = json.Unmarshal(data, &unmarshaled)
	assert.NoError(t, err)
	assert.Equal(t, table.Name, unmarshaled.Name)
	assert.Equal(t, table.ID, unmarshaled.ID)
}

func TestServer(t *testing.T) {
	server := Server{
		ID:         "server-1",
		Name:       "Test Server",
		PeerURLs:   []string{"peer1", "peer2"},
		ClientURLs: []string{"client1", "client2"},
	}

	assert.Equal(t, "server-1", server.ID)
	assert.Equal(t, "Test Server", server.Name)
	assert.Len(t, server.PeerURLs, 2)
	assert.Contains(t, server.PeerURLs, "peer1")
	assert.Contains(t, server.PeerURLs, "peer2")
	assert.Len(t, server.ClientURLs, 2)
	assert.Contains(t, server.ClientURLs, "client1")
	assert.Contains(t, server.ClientURLs, "client2")
}

func TestServerJSONSerialization(t *testing.T) {
	server := Server{
		ID:         "json-server",
		Name:       "JSON Server",
		PeerURLs:   []string{"json-peer"},
		ClientURLs: []string{"json-client"},
	}

	// Test marshaling
	data, err := json.Marshal(server)
	assert.NoError(t, err)
	assert.Contains(t, string(data), `"id":"json-server"`)
	assert.Contains(t, string(data), `"name":"JSON Server"`)
	assert.Contains(t, string(data), `"peerURLs":["json-peer"]`)
	assert.Contains(t, string(data), `"clientURLs":["json-client"]`)

	// Test unmarshaling
	var unmarshaled Server
	err = json.Unmarshal(data, &unmarshaled)
	assert.NoError(t, err)
	assert.Equal(t, server.ID, unmarshaled.ID)
	assert.Equal(t, server.Name, unmarshaled.Name)
	assert.Equal(t, server.PeerURLs, unmarshaled.PeerURLs)
	assert.Equal(t, server.ClientURLs, unmarshaled.ClientURLs)
}

func TestMetricsData(t *testing.T) {
	timestamp := time.Now()
	metricsData := MetricsData{
		Data:      "# Prometheus metrics data",
		Timestamp: timestamp,
		Source:    "test-cluster",
	}

	assert.Equal(t, "# Prometheus metrics data", metricsData.Data)
	assert.Equal(t, timestamp, metricsData.Timestamp)
	assert.Equal(t, "test-cluster", metricsData.Source)
}

func TestMetricsDataJSONSerialization(t *testing.T) {
	timestamp := time.Date(2023, 1, 1, 12, 0, 0, 0, time.UTC)
	metricsData := MetricsData{
		Data:      "metrics_test_counter 42",
		Timestamp: timestamp,
		Source:    "json-cluster",
	}

	// Test marshaling
	data, err := json.Marshal(metricsData)
	assert.NoError(t, err)
	assert.Contains(t, string(data), `"Data":"metrics_test_counter 42"`)
	assert.Contains(t, string(data), `"Source":"json-cluster"`)

	// Test unmarshaling
	var unmarshaled MetricsData
	err = json.Unmarshal(data, &unmarshaled)
	assert.NoError(t, err)
	assert.Equal(t, metricsData.Data, unmarshaled.Data)
	assert.Equal(t, metricsData.Source, unmarshaled.Source)
	// Note: Time comparison might need special handling due to precision
	assert.True(t, metricsData.Timestamp.Equal(unmarshaled.Timestamp))
}

func TestEmptyStructs(t *testing.T) {
	// Test that empty structs can be created
	emptyStatus := Status{}
	assert.Equal(t, "", emptyStatus.Status)
	assert.Equal(t, "", emptyStatus.Message)
	assert.Nil(t, emptyStatus.Config)
	assert.Nil(t, emptyStatus.Tables)
	assert.Nil(t, emptyStatus.Errors)

	emptyTable := Table{}
	assert.Equal(t, "", emptyTable.Name)
	assert.Equal(t, "", emptyTable.ID)

	emptyKVP := KeyValuePair{}
	assert.Equal(t, "", emptyKVP.Key)
	assert.Equal(t, "", emptyKVP.Value)

	emptyServer := Server{}
	assert.Equal(t, "", emptyServer.ID)
	assert.Equal(t, "", emptyServer.Name)
	assert.Nil(t, emptyServer.PeerURLs)
	assert.Nil(t, emptyServer.ClientURLs)
}

func TestComplexStatus(t *testing.T) {
	// Test a more complex status structure
	status := Status{
		Status:  "degraded",
		Message: "Some services are experiencing issues",
		Config: map[string]interface{}{
			"max_connections": 100,
			"timeout":         "30s",
			"enabled":         true,
			"servers":         []string{"server1", "server2"},
		},
		Tables: map[string]TableStatus{
			"users": {
				LogSize:          10240,
				DBSize:           20480,
				Leader:           "node1",
				RaftIndex:        1000,
				RaftTerm:         10,
				RaftAppliedIndex: 995,
			},
			"sessions": {
				LogSize:          5120,
				DBSize:           10240,
				Leader:           "node2",
				RaftIndex:        500,
				RaftTerm:         8,
				RaftAppliedIndex: 498,
			},
		},
		Errors: []string{
			"Connection timeout to node3",
			"High memory usage on node2",
		},
	}

	// Validate complex config
	assert.Equal(t, 100, status.Config["max_connections"])
	assert.Equal(t, "30s", status.Config["timeout"])
	assert.Equal(t, true, status.Config["enabled"])
	servers := status.Config["servers"].([]string)
	assert.Len(t, servers, 2)
	assert.Contains(t, servers, "server1")

	// Validate multiple tables
	assert.Len(t, status.Tables, 2)
	assert.Contains(t, status.Tables, "users")
	assert.Contains(t, status.Tables, "sessions")
	assert.Equal(t, "node1", status.Tables["users"].Leader)
	assert.Equal(t, "node2", status.Tables["sessions"].Leader)

	// Validate multiple errors
	assert.Len(t, status.Errors, 2)
	assert.Contains(t, status.Errors, "Connection timeout to node3")
	assert.Contains(t, status.Errors, "High memory usage on node2")
}
