// Package armada provides a client for interacting with the Armada KV database server.
// This file contains the data models used by the Armada client.
package armada

import "time"

// Status represents the status of the Armada server.
type Status struct {
	// Status is the current status of the server (e.g., "ok", "error").
	Status string `json:"status"`

	// Message is a human-readable message describing the status.
	Message string `json:"message"`

	// Config contains the server configuration values.
	// It is a map of configuration keys to their values.
	Config map[string]interface{} `json:"config,omitempty"`

	// Tables contains information about the tables on the server.
	// It is a map of table names to their status.
	Tables map[string]TableStatus `json:"tables,omitempty"`

	// Errors contains alarm/health information and status.
	Errors []string `json:"errors,omitempty"`
}

// TableStatus represents the status of a table in the Armada database.
type TableStatus struct {
	// LogSize is the size of the raft log in bytes.
	LogSize int64 `json:"logSize"`

	// DBSize is the size of the backend database physically allocated in bytes.
	DBSize int64 `json:"dbSize"`

	// Leader is the member ID which the responding member believes is the current leader.
	Leader string `json:"leader"`

	// RaftIndex is the current raft committed index.
	RaftIndex uint64 `json:"raftIndex"`

	// RaftTerm is the current raft term.
	RaftTerm uint64 `json:"raftTerm"`

	// RaftAppliedIndex is the current raft applied index.
	RaftAppliedIndex uint64 `json:"raftAppliedIndex"`
}

// ClusterInfo represents information about the Armada cluster.
type ClusterInfo struct {
	// NodeID is the ID of the current node.
	NodeID string `json:"nodeId"`

	// NodeAddress is the address of the current node.
	NodeAddress string `json:"nodeAddress"`

	// Members is a list of all servers in the cluster.
	Members []Server `json:"members"`
}

// KeyValuePair represents a key-value pair stored in the Armada database.
type KeyValuePair struct {
	// Key is the key of the pair.
	Key string `json:"key"`

	// Value is the value associated with the key.
	Value string `json:"value"`
}

// Table represents a table in the Armada database.
type Table struct {
	// Name is the name of the table.
	Name string `json:"name"`

	// ID is the unique identifier of the table.
	ID string `json:"id"`
}

// Server represents an Armada server in the cluster.
type Server struct {
	// ID is the unique identifier of the server.
	ID string `json:"id"`

	// Name is the human-readable name of the server.
	Name string `json:"name"`

	// PeerURLs is the list of URLs the server exposes to the cluster for communication.
	PeerURLs []string `json:"peerURLs"`

	// ClientURLs is the list of URLs the server exposes to clients for communication.
	ClientURLs []string `json:"clientURLs"`
}

// MetricsData represents metrics data received from Armada
type MetricsData struct {
	Data      string    // The metrics data in Prometheus text format (or other requested format)
	Timestamp time.Time // The timestamp when the metrics were collected
	Source    string    // The cluster/server source of the metrics
}
