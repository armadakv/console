// Package armada provides a client for interacting with the Armada KV database server.
// It implements a gRPC client that communicates with the Armada server to perform
// operations such as getting server status, cluster information, metrics, and
// key-value operations.
package armada

import (
	"context"
	"crypto/tls"
	"fmt"
	"strings"
	"sync"

	regattapb "github.com/armadakv/console/backend/armada/pb"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
)

// ArmadaClient is the interface for interacting with the Armada server.
// It provides methods for retrieving server status, cluster information, metrics,
// and performing key-value operations.
type ArmadaClient interface {
	// GetStatus retrieves the current status of the Armada server.
	// If serverAddress is provided, it will connect to that server to get the status.
	// Otherwise, it will use the client's default server address.
	// It returns a Status object containing the status and a message.
	GetStatus(ctx context.Context, serverAddress string) (*Status, error)

	// GetClusterInfo retrieves information about the Armada cluster.
	// It returns a ClusterInfo object containing node IDs, addresses, and raft information.
	GetClusterInfo(ctx context.Context) (*ClusterInfo, error)

	// GetAllServers retrieves information about all servers in the Armada cluster.
	// It returns a slice of Server objects containing server IDs, names, and URLs.
	GetAllServers(ctx context.Context) ([]Server, error)

	// GetMetrics retrieves performance metrics from the Armada server.
	// It returns a Metrics object containing various performance metrics.
	GetMetrics(ctx context.Context) (*Metrics, error)

	// GetTables retrieves a list of all tables in the Armada server.
	// It returns a slice of Table objects.
	GetTables(ctx context.Context) ([]Table, error)

	// CreateTable creates a new table in the Armada server.
	// It returns the ID of the newly created table.
	CreateTable(ctx context.Context, tableName string) (string, error)

	// DeleteTable deletes a table from the Armada server.
	// It returns an error if the operation fails.
	DeleteTable(ctx context.Context, tableName string) error

	// GetKeyValuePairs retrieves key-value pairs from the specified table.
	// The filtering can be done in two ways:
	// 1. By prefix: if prefix is non-empty, returns all key-value pairs with keys starting with prefix
	// 2. By range: if start and end are non-empty, returns all key-value pairs with keys in [start, end)
	// The limit parameter controls the maximum number of pairs to return.
	// It returns a slice of KeyValuePair objects.
	GetKeyValuePairs(ctx context.Context, table string, prefix string, start string, end string, limit int) ([]KeyValuePair, error)

	// GetKeyValue retrieves a specific key-value pair from the specified table.
	// It returns the key-value pair if found, or an error if not found or if the operation fails.
	GetKeyValue(ctx context.Context, table string, key string) (*KeyValuePair, error)

	// PutKeyValue stores a key-value pair in the Armada server.
	// The table parameter specifies which table to store the key-value pair in.
	// It returns an error if the operation fails.
	PutKeyValue(ctx context.Context, table, key, value string) error

	// DeleteKey deletes a key from the Armada server.
	// The table parameter specifies which table to delete the key from.
	// It returns an error if the operation fails.
	DeleteKey(ctx context.Context, table, key string) error

	// Close closes the connection to the Armada server.
	// It should be called when the client is no longer needed.
	Close() error
}

// Status represents the status of the Armada server.
type Status struct {
	// Status is the current status of the server (e.g., "ok", "error").
	Status string `json:"status"`

	// Message is a human-readable message describing the status.
	Message string `json:"message"`

	// Config contains the server configuration values.
	// It is a map of configuration keys to their values.
	Config map[string]interface{} `json:"config,omitempty"`
}

// ClusterInfo represents information about the Armada cluster.
type ClusterInfo struct {
	// NodeID is the ID of the current node.
	NodeID string `json:"nodeId"`

	// NodeAddress is the address of the current node.
	NodeAddress string `json:"nodeAddress"`

	// Leader is the ID of the current leader node in the cluster.
	Leader string `json:"leader"`

	// Followers is a list of IDs of the follower nodes in the cluster.
	Followers []string `json:"followers"`

	// Term is the current Raft term of the cluster.
	Term uint64 `json:"term"`
}

// Metrics represents performance metrics from the Armada server.
type Metrics struct {
	// RequestCount is the total number of requests processed by the server.
	RequestCount int64 `json:"requestCount"`

	// KeyCount is the total number of keys stored in the database.
	KeyCount int64 `json:"keyCount"`

	// DiskUsage is the amount of disk space used by the database in bytes.
	DiskUsage int64 `json:"diskUsage"`

	// MemoryUsage is the amount of memory used by the server in bytes.
	MemoryUsage int64 `json:"memoryUsage"`

	// UpTime is the uptime of the server in seconds.
	UpTime int64 `json:"upTime"`

	// RequestLatency is the average latency of requests in milliseconds.
	RequestLatency int64 `json:"requestLatency"`
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

// client is the implementation of the ArmadaClient interface.
// It uses gRPC to communicate with the Armada server.
type client struct {
	// address is the address of the Armada server.
	address string

	// conn is the gRPC connection to the Armada server.
	conn *grpc.ClientConn

	// kvClient is the gRPC client for key-value operations.
	kvClient regattapb.KVClient

	// clusterClient is the gRPC client for cluster operations.
	clusterClient regattapb.ClusterClient

	// tablesClient is the gRPC client for table operations.
	tablesClient regattapb.TablesClient

	// logger is the structured logger for logging.
	logger *zap.Logger

	// serverConnections is a cache of connections to other servers in the cluster.
	// The key is the server address, and the value is the gRPC connection.
	serverConnections     map[string]*grpc.ClientConn
	serverConnectionsLock sync.RWMutex
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
func createGRPCConnection(serverAddress string, logger *zap.Logger) (*grpc.ClientConn, error) {
	var creds credentials.TransportCredentials
	var dialAddress string

	// Check if address begins with http or https
	if strings.HasPrefix(serverAddress, "https://") {
		// Use TLS for https
		creds = credentials.NewTLS(&tls.Config{})
		// Remove https:// prefix and replace with dns://
		dialAddress = "dns:/" + strings.TrimPrefix(serverAddress, "https://")
	} else if strings.HasPrefix(serverAddress, "http://") {
		// Use insecure connection for http
		creds = insecure.NewCredentials()
		// Remove http:// prefix and replace with dns://
		dialAddress = "dns:/" + strings.TrimPrefix(serverAddress, "http://")
	} else {
		// Default to insecure if no protocol specified
		creds = insecure.NewCredentials()
		dialAddress = serverAddress
	}

	logger.Info("Dialing Armada server", zap.String("address", dialAddress))
	conn, err := grpc.Dial(dialAddress, grpc.WithTransportCredentials(creds))
	if err != nil {
		logger.Error("Failed to connect to Armada server", zap.Error(err))
		return nil, err
	}

	return conn, nil
}

// NewClient creates a new Armada client with a connection to the specified address.
// It establishes a gRPC connection to the Armada server and initializes the necessary
// gRPC clients for different operations.
//
// Parameters:
//   - address: The address of the Armada server (e.g., "localhost:8081").
//   - logger: The structured logger for logging.
//
// Returns:
//   - An ArmadaClient instance if successful.
//   - An error if the connection could not be established.
func NewClient(address string, logger *zap.Logger) (ArmadaClient, error) {
	logger.Info("Creating new Armada client", zap.String("address", address))

	conn, err := createGRPCConnection(address, logger)
	if err != nil {
		return nil, err
	}

	// Create the gRPC clients
	kvClient := regattapb.NewKVClient(conn)
	clusterClient := regattapb.NewClusterClient(conn)
	tablesClient := regattapb.NewTablesClient(conn)

	return &client{
		address:           address,
		conn:              conn,
		kvClient:          kvClient,
		clusterClient:     clusterClient,
		tablesClient:      tablesClient,
		logger:            logger,
		serverConnections: make(map[string]*grpc.ClientConn),
	}, nil
}

// getServerConnection gets or creates a gRPC connection to the specified server address.
// It uses the serverConnections cache to avoid creating duplicate connections.
//
// Parameters:
//   - serverAddress: The address of the server to connect to.
//
// Returns:
//   - A gRPC connection to the server.
//   - The gRPC cluster client using that connection.
//   - An error if the connection could not be established.
func (c *client) getServerConnection(serverAddress string) (*grpc.ClientConn, regattapb.ClusterClient, error) {
	// If requesting the default address, use the main client
	if serverAddress == c.address {
		return c.conn, c.clusterClient, nil
	}

	// Check if we already have a connection to this server
	c.serverConnectionsLock.RLock()
	conn, exists := c.serverConnections[serverAddress]
	c.serverConnectionsLock.RUnlock()

	if exists {
		c.logger.Debug("Using cached connection to server", zap.String("address", serverAddress))
		return conn, regattapb.NewClusterClient(conn), nil
	}

	// Create a new connection
	conn, err := createGRPCConnection(serverAddress, c.logger)
	if err != nil {
		return nil, nil, err
	}

	// Cache the connection
	c.serverConnectionsLock.Lock()
	c.serverConnections[serverAddress] = conn
	c.serverConnectionsLock.Unlock()

	return conn, regattapb.NewClusterClient(conn), nil
}

// GetStatus retrieves the current status of the Armada server.
// It calls the Status method of the Cluster gRPC service and converts
// the response to a Status object.
//
// Parameters:
//   - ctx: The context for the request.
//   - serverAddress: The address of the server to get the status from.
//     If empty, the client's default server address will be used.
//
// Returns:
//   - A Status object containing the status and a message.
//   - An error if the request fails.
func (c *client) GetStatus(ctx context.Context, serverAddress string) (*Status, error) {
	// If no server address is provided, use the client's default address
	address := c.address
	if serverAddress != "" {
		address = serverAddress
	}

	c.logger.Info("Getting status from Armada server", zap.String("address", address))

	// Get or create connection to the server
	_, clusterClient, err := c.getServerConnection(address)
	if err != nil {
		return &Status{
			Status:  "error",
			Message: "Failed to connect to Armada server: " + err.Error(),
		}, nil
	}

	// Call the Status method of the Cluster service with config flag enabled
	resp, err := clusterClient.Status(ctx, &regattapb.StatusRequest{
		Config: true, // Request config data
	})
	if err != nil {
		c.logger.Error("Failed to get status from Armada server", zap.Error(err))
		return &Status{
			Status:  "error",
			Message: "Failed to connect to Armada server: " + err.Error(),
		}, nil
	}

	// Convert the config from structpb to map[string]interface{}
	var configMap map[string]interface{}
	if resp.Config != nil {
		configMap = resp.Config.AsMap()
	}

	// Convert the response to our Status type
	return &Status{
		Status:  "ok",
		Message: resp.Version + " - " + resp.Info,
		Config:  configMap,
	}, nil
}

// GetClusterInfo retrieves information about the Armada cluster.
// It calls the MemberList and Status methods of the Cluster gRPC service
// to gather information about the cluster nodes and their roles.
//
// Parameters:
//   - ctx: The context for the request.
//
// Returns:
//   - A ClusterInfo object containing information about the cluster.
//   - An error if the request fails.
func (c *client) GetClusterInfo(ctx context.Context) (*ClusterInfo, error) {
	c.logger.Info("Getting cluster info from Armada server", zap.String("address", c.address))

	// Call the MemberList method of the Cluster service
	resp, err := c.clusterClient.MemberList(ctx, &regattapb.MemberListRequest{})
	if err != nil {
		c.logger.Error("Failed to get cluster info from Armada server", zap.Error(err))
		return nil, err
	}

	// Get the status to find the leader
	statusResp, err := c.clusterClient.Status(ctx, &regattapb.StatusRequest{})
	if err != nil {
		c.logger.Error("Failed to get status from Armada server", zap.Error(err))
		return nil, err
	}

	// Find the leader and followers
	var leader string
	var followers []string
	var nodeID string
	var nodeAddress string
	var term uint64

	// Set the current node ID and address
	nodeID = statusResp.Id

	// Find the leader and followers from the member list
	for _, member := range resp.Members {
		if len(member.ClientURLs) > 0 {
			if member.Id == nodeID {
				nodeAddress = member.ClientURLs[0]
			}

			// Check if this member is the leader
			isLeader := false
			for tableName, table := range statusResp.Tables {
				if table.Leader == member.Id {
					isLeader = true
					term = table.RaftTerm
					c.logger.Info("Found leader for table",
						zap.String("table", tableName),
						zap.String("leader", member.Id),
						zap.Uint64("term", term))
					break
				}
			}

			if isLeader {
				leader = member.Id
			} else {
				followers = append(followers, member.Id)
			}
		}
	}

	return &ClusterInfo{
		NodeID:      nodeID,
		NodeAddress: nodeAddress,
		Leader:      leader,
		Followers:   followers,
		Term:        term,
	}, nil
}

// GetMetrics retrieves performance metrics from the Armada server.
// It calls the Status method of the Cluster gRPC service and extracts
// metrics information from the response.
//
// Parameters:
//   - ctx: The context for the request.
//
// Returns:
//   - A Metrics object containing various performance metrics.
//   - An error if the request fails.
func (c *client) GetMetrics(ctx context.Context) (*Metrics, error) {
	c.logger.Info("Getting metrics from Armada server", zap.String("address", c.address))

	// Get the status to extract metrics
	statusResp, err := c.clusterClient.Status(ctx, &regattapb.StatusRequest{})
	if err != nil {
		c.logger.Error("Failed to get status from Armada server", zap.Error(err))
		return nil, err
	}

	// Calculate metrics from the status response
	var diskUsage int64
	var keyCount int64
	var requestCount int64
	var requestLatency int64

	// Sum up metrics from all tables
	for _, table := range statusResp.Tables {
		diskUsage += table.DbSize + table.LogSize
		keyCount += int64(table.RaftIndex)            // Approximation of key count
		requestCount += int64(table.RaftAppliedIndex) // Approximation of request count
	}

	// Calculate average request latency (placeholder)
	if len(statusResp.Tables) > 0 {
		requestLatency = 5 // Placeholder, not available in the API
	}

	// Get memory usage (placeholder)
	memoryUsage := int64(1024 * 1024 * 5) // 5 MB placeholder

	// Get uptime (placeholder)
	upTime := int64(3600) // 1 hour placeholder

	return &Metrics{
		RequestCount:   requestCount,
		KeyCount:       keyCount,
		DiskUsage:      diskUsage,
		MemoryUsage:    memoryUsage,
		UpTime:         upTime,
		RequestLatency: requestLatency,
	}, nil
}

// GetKeyValuePairs retrieves key-value pairs from the specified table.
// It calls the Range method of the KV gRPC service to fetch the key-value pairs.
// The filtering can be done in two ways:
// 1. By prefix: if prefix is non-empty, returns all key-value pairs with keys starting with prefix
// 2. By range: if start and end are non-empty, returns all key-value pairs with keys in [start, end)
//
// Parameters:
//   - ctx: The context for the request.
//   - table: The table to query.
//   - prefix: The prefix to filter the keys (used if non-empty).
//   - start: The start key for range filtering (used if prefix is empty and both start and end are non-empty).
//   - end: The end key for range filtering (used if prefix is empty and both start and end are non-empty).
//   - limit: The maximum number of key-value pairs to return.
//
// Returns:
//   - A slice of KeyValuePair objects.
//   - An error if the request fails.
func (c *client) GetKeyValuePairs(ctx context.Context, table, prefix, start, end string, limit int) ([]KeyValuePair, error) {
	var rangeStart, rangeEnd string
	filterType := "none"

	// Determine filtering type and set appropriate parameters
	if prefix != "" {
		// Prefix filtering
		rangeStart = prefix
		rangeEnd = incrementLastByte(prefix)
		filterType = "prefix"
	} else if start != "" && end != "" {
		// Range filtering
		rangeStart = start
		rangeEnd = end
		filterType = "range"
	} else {
		// No filtering, get all keys
		rangeStart = string([]byte{0x00})
		rangeEnd = string([]byte{0x00})
		filterType = "all"
	}

	c.logger.Info("Getting key-value pairs",
		zap.String("filter", filterType),
		zap.String("table", table),
		zap.String("address", c.address),
		zap.Int("limit", limit))

	// Create a range request with the appropriate parameters
	req := &regattapb.RangeRequest{
		Table:    []byte(table),
		Key:      []byte(rangeStart),
		RangeEnd: []byte(rangeEnd),
		Limit:    int64(limit),
	}

	// Call the Range method of the KV service
	resp, err := c.kvClient.Range(ctx, req)
	if err != nil {
		c.logger.Error("Failed to get key-value pairs from Armada server",
			zap.Error(err),
			zap.String("table", table),
			zap.String("filter", filterType))
		return nil, err
	}

	// Convert the response to our KeyValuePair type
	pairs := make([]KeyValuePair, 0, len(resp.Kvs))
	for _, kv := range resp.Kvs {
		pairs = append(pairs, KeyValuePair{
			Key:   string(kv.Key),
			Value: string(kv.Value),
		})
	}

	return pairs, nil
}

// incrementLastByte increments the last byte of a string to get the range end for prefix search.
// This is used to create a range end for the Range request to fetch all keys with a given prefix.
//
// Parameters:
//   - s: The string to increment.
//
// Returns:
//   - The string with the last byte incremented.
func incrementLastByte(s string) string {
	if s == "" {
		return ""
	}

	bytes := []byte(s)
	bytes[len(bytes)-1]++
	return string(bytes)
}

// GetKeyValue retrieves a specific key-value pair from the specified table.
// It returns the key-value pair if found, or an error if not found or if the operation fails.
//
// Parameters:
//   - ctx: The context for the request.
//   - table: The table to query.
//   - key: The key to look up.
//
// Returns:
//   - The key-value pair if found.
//   - An error if not found or if the operation fails.
func (c *client) GetKeyValue(ctx context.Context, table, key string) (*KeyValuePair, error) {
	c.logger.Info("Getting specific key-value pair",
		zap.String("table", table),
		zap.String("key", key),
		zap.String("address", c.address))

	// Create a range request with exact key match (no range)
	req := &regattapb.RangeRequest{
		Table: []byte(table),
		Key:   []byte(key),
		// Leave RangeEnd empty for exact key lookup
		Limit: 1, // We only need one key
	}

	// Call the Range method of the KV service
	resp, err := c.kvClient.Range(ctx, req)
	if err != nil {
		c.logger.Error("Failed to get key-value pair from Armada server",
			zap.Error(err),
			zap.String("table", table),
			zap.String("key", key))
		return nil, err
	}

	// Check if we got any results
	if len(resp.Kvs) == 0 {
		return nil, fmt.Errorf("key not found: %s", key)
	}

	// Convert the response to our KeyValuePair type
	kv := resp.Kvs[0]
	return &KeyValuePair{
		Key:   string(kv.Key),
		Value: string(kv.Value),
	}, nil
}

// PutKeyValue stores a key-value pair in the Armada server.
// It calls the Put method of the KV gRPC service to store the key-value pair.
//
// Parameters:
//   - ctx: The context for the request.
//   - table: The table to store the key-value pair in.
//   - key: The key to store.
//   - value: The value to associate with the key.
//
// Returns:
//   - An error if the operation fails.
func (c *client) PutKeyValue(ctx context.Context, table, key, value string) error {
	c.logger.Info("Putting key-value pair",
		zap.String("key", key),
		zap.String("value", value),
		zap.String("table", table),
		zap.String("address", c.address))

	// Create a put request
	req := &regattapb.PutRequest{
		Table: []byte(table),
		Key:   []byte(key),
		Value: []byte(value),
	}

	// Call the Put method of the KV service
	_, err := c.kvClient.Put(ctx, req)
	if err != nil {
		c.logger.Error("Failed to put key-value pair to Armada server",
			zap.Error(err),
			zap.String("table", table),
			zap.String("key", key))
		return err
	}

	return nil
}

// DeleteKey deletes a key from the Armada server.
// It calls the DeleteRange method of the KV gRPC service to delete the key.
//
// Parameters:
//   - ctx: The context for the request.
//   - table: The table to delete the key from.
//   - key: The key to delete.
//
// Returns:
//   - An error if the operation fails.
func (c *client) DeleteKey(ctx context.Context, table, key string) error {
	c.logger.Info("Deleting key",
		zap.String("key", key),
		zap.String("table", table),
		zap.String("address", c.address))

	// Create a delete range request
	req := &regattapb.DeleteRangeRequest{
		Table: []byte(table),
		Key:   []byte(key),
	}

	// Call the DeleteRange method of the KV service
	_, err := c.kvClient.DeleteRange(ctx, req)
	if err != nil {
		c.logger.Error("Failed to delete key from Armada server",
			zap.Error(err),
			zap.String("table", table),
			zap.String("key", key))
		return err
	}

	return nil
}

// GetTables retrieves a list of all tables in the Armada server.
// It calls the List method of the Tables gRPC service to fetch the tables.
//
// Parameters:
//   - ctx: The context for the request.
//
// Returns:
//   - A slice of Table objects.
//   - An error if the request fails.
func (c *client) GetTables(ctx context.Context) ([]Table, error) {
	c.logger.Info("Getting tables from Armada server", zap.String("address", c.address))

	// Create a list tables request
	req := &regattapb.ListTablesRequest{}

	// Call the List method of the Tables service
	resp, err := c.tablesClient.List(ctx, req)
	if err != nil {
		c.logger.Error("Failed to get tables from Armada server", zap.Error(err))
		return nil, err
	}

	// Convert the response to our Table type
	tables := make([]Table, 0, len(resp.GetTables()))
	for _, tableInfo := range resp.GetTables() {
		tables = append(tables, Table{
			Name: tableInfo.GetName(),
			ID:   tableInfo.GetId(),
		})
	}

	return tables, nil
}

// CreateTable creates a new table in the Armada server.
// It calls the Create method of the Tables gRPC service to create the table.
//
// Parameters:
//   - ctx: The context for the request.
//   - tableName: The name of the table to create.
//
// Returns:
//   - The ID of the newly created table.
//   - An error if the operation fails.
func (c *client) CreateTable(ctx context.Context, tableName string) (string, error) {
	c.logger.Info("Creating table",
		zap.String("tableName", tableName),
		zap.String("address", c.address))

	// Create a create table request
	req := &regattapb.CreateTableRequest{
		Name: tableName,
	}

	// Call the Create method of the Tables service
	resp, err := c.tablesClient.Create(ctx, req)
	if err != nil {
		c.logger.Error("Failed to create table",
			zap.Error(err),
			zap.String("tableName", tableName))
		return "", err
	}

	return resp.GetId(), nil
}

// DeleteTable deletes a table from the Armada server.
// It calls the Delete method of the Tables gRPC service to delete the table.
//
// Parameters:
//   - ctx: The context for the request.
//   - tableName: The name of the table to delete.
//
// Returns:
//   - An error if the operation fails.
func (c *client) DeleteTable(ctx context.Context, tableName string) error {
	c.logger.Info("Deleting table",
		zap.String("tableName", tableName),
		zap.String("address", c.address))

	// Create a delete table request
	req := &regattapb.DeleteTableRequest{
		Name: tableName,
	}

	// Call the Delete method of the Tables service
	_, err := c.tablesClient.Delete(ctx, req)
	if err != nil {
		c.logger.Error("Failed to delete table",
			zap.Error(err),
			zap.String("tableName", tableName))
		return err
	}

	return nil
}

// GetAllServers retrieves information about all servers in the Armada cluster.
// It calls the MemberList method of the Cluster gRPC service to fetch information
// about all servers in the cluster.
//
// Parameters:
//   - ctx: The context for the request.
//
// Returns:
//   - A slice of Server objects containing server IDs, names, and URLs.
//   - An error if the request fails.
func (c *client) GetAllServers(ctx context.Context) ([]Server, error) {
	c.logger.Info("Getting all servers from Armada cluster", zap.String("address", c.address))

	// Call the MemberList method of the Cluster service
	resp, err := c.clusterClient.MemberList(ctx, &regattapb.MemberListRequest{})
	if err != nil {
		c.logger.Error("Failed to get servers from Armada cluster", zap.Error(err))
		return nil, err
	}

	// Convert the response to our Server type
	servers := make([]Server, 0, len(resp.GetMembers()))
	for _, member := range resp.GetMembers() {
		servers = append(servers, Server{
			ID:         member.GetId(),
			Name:       member.GetName(),
			PeerURLs:   member.GetPeerURLs(),
			ClientURLs: member.GetClientURLs(),
		})
	}

	return servers, nil
}

// Close closes the connection to the Armada server.
// It should be called when the client is no longer needed to free up resources.
//
// Returns:
//   - An error if the connection could not be closed properly.
func (c *client) Close() error {
	c.logger.Info("Closing connection to Armada server", zap.String("address", c.address))

	var lastErr error

	// Close all cached server connections
	c.serverConnectionsLock.Lock()
	for address, conn := range c.serverConnections {
		c.logger.Debug("Closing cached connection", zap.String("address", address))
		if err := conn.Close(); err != nil {
			c.logger.Error("Failed to close cached connection",
				zap.String("address", address),
				zap.Error(err))
			lastErr = err
		}
	}
	// Clear the map
	c.serverConnections = make(map[string]*grpc.ClientConn)
	c.serverConnectionsLock.Unlock()

	// Close the main connection
	if c.conn != nil {
		if err := c.conn.Close(); err != nil {
			c.logger.Error("Failed to close main connection", zap.Error(err))
			lastErr = err
		}
	}

	return lastErr
}
