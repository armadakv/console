// Package armada provides a client for interacting with the Armada KV database server.
// It implements a gRPC client that communicates with the Armada server to perform
// operations such as getting server status, cluster information, and key-value operations.
package armada

import (
	"context"
	"fmt"
	"time"

	regattapb "github.com/armadakv/console/backend/armada/pb"
	"go.uber.org/zap"
)

// Client is the implementation of the ArmadaClient interface.
// It uses gRPC to communicate with the Armada server.
type Client struct {
	// address is the address of the Armada server.
	address string

	// logger is the structured logger for logging.
	logger *zap.Logger

	// connectionPool manages all server connections
	connectionPool ConnectionPoolInterface
}

// NewClient creates a new Armada client with a connection to the specified address.
// It establishes a gRPC connection to the Armada server and initializes the necessary
// gRPC clients for different operations. It also discovers and connects to all members
// in the cluster for better availability and performance.
//
// Parameters:
//   - address: The address of the Armada server (e.g., "localhost:8081").
//   - logger: The structured logger for logging.
//
// Returns:
//   - An ArmadaClient instance if successful.
//   - An error if the connection could not be established.
func NewClient(address string, logger *zap.Logger) (*Client, error) {
	logger.Info("Creating new Armada client", zap.String("address", address))

	// Create a new connection pool
	connectionPool := NewConnectionPool(logger)

	// Initialize the client
	client := &Client{
		address:        address,
		logger:         logger,
		connectionPool: connectionPool,
	}

	// Try to establish the main connection to ensure it works
	_, err := connectionPool.GetConnection(context.Background(), address)
	if err != nil {
		_ = connectionPool.Close()
		return nil, fmt.Errorf("failed to establish initial connection: %w", err)
	}

	return client, nil
}

// GetConnectionPool returns the connection pool used by this client
func (c *Client) GetConnectionPool() ConnectionPoolInterface {
	return c.connectionPool
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
func (c *Client) GetStatus(ctx context.Context, serverAddress string) (*Status, error) {
	// If no server address is provided, use the client's default address
	address := c.address
	if serverAddress != "" {
		address = serverAddress
	}

	c.logger.Info("Getting status from Armada server", zap.String("address", address))

	// Get connection from pool
	serverConn, err := c.connectionPool.GetConnection(ctx, address)
	if err != nil {
		return &Status{
			Status:  "error",
			Message: "Failed to connect to Armada server: " + err.Error(),
		}, nil
	}

	// Call the Status method of the Cluster service with config flag enabled
	resp, err := serverConn.ClusterClient.Status(ctx, &regattapb.StatusRequest{
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

	// Map table status from gRPC response to our TableStatus type
	tables := make(map[string]TableStatus)
	for tableName, tableStatus := range resp.Tables {
		tables[tableName] = TableStatus{
			LogSize:          tableStatus.LogSize,
			DBSize:           tableStatus.DbSize,
			Leader:           tableStatus.Leader,
			RaftIndex:        tableStatus.RaftIndex,
			RaftTerm:         tableStatus.RaftTerm,
			RaftAppliedIndex: tableStatus.RaftAppliedIndex,
		}
	}

	// Convert the response to our Status type
	return &Status{
		Status:  "ok",
		Message: resp.Version + " - " + resp.Info,
		Config:  configMap,
		Tables:  tables,
		Errors:  resp.Errors,
	}, nil
}

// GetClusterInfo retrieves information about the Armada cluster.
// It calls the MemberList method of the Cluster gRPC service to fetch information
// about the cluster nodes.
//
// Parameters:
//   - ctx: The context for the request.
//
// Returns:
//   - A ClusterInfo object containing information about the cluster.
//   - An error if the request fails.
func (c *Client) GetClusterInfo(ctx context.Context) (*ClusterInfo, error) {
	c.logger.Info("Getting cluster info from Armada server", zap.String("address", c.address))

	// Get connection from pool
	serverConn, err := c.connectionPool.GetConnection(ctx, c.address)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Armada server: %w", err)
	}

	// Call the MemberList method of the Cluster service
	resp, err := serverConn.ClusterClient.MemberList(ctx, &regattapb.MemberListRequest{})
	if err != nil {
		c.logger.Error("Failed to get cluster info from Armada server", zap.Error(err))
		return nil, err
	}

	// Extract the current node ID (this server's ID)
	nodeID := ""
	var nodeAddress string

	// Convert members to our Server type
	servers := make([]Server, 0, len(resp.GetMembers()))
	for _, member := range resp.GetMembers() {
		// Add to the servers list
		servers = append(servers, Server{
			ID:         member.GetId(),
			Name:       member.GetName(),
			PeerURLs:   member.GetPeerURLs(),
			ClientURLs: member.GetClientURLs(),
		})

		// If this is the node we're connected to, record its ID and address
		if len(member.ClientURLs) > 0 && member.ClientURLs[0] == c.address {
			nodeID = member.Id
			nodeAddress = member.ClientURLs[0]
		}
	}

	// Return simple ClusterInfo with the members information
	// Leader and followers are not calculated directly from gRPC response
	return &ClusterInfo{
		NodeID:      nodeID,
		NodeAddress: nodeAddress,
		Members:     servers,
	}, nil
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
func (c *Client) GetAllServers(ctx context.Context) ([]Server, error) {
	c.logger.Info("Getting all servers from Armada cluster", zap.String("address", c.address))

	// Get connection from pool
	serverConn, err := c.connectionPool.GetConnection(ctx, c.address)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Armada server: %w", err)
	}

	// Call the MemberList method of the Cluster service
	resp, err := serverConn.ClusterClient.MemberList(ctx, &regattapb.MemberListRequest{})
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

// GetTables retrieves a list of all tables in the Armada server.
// It calls the List method of the Tables gRPC service to fetch the tables.
//
// Parameters:
//   - ctx: The context for the request.
//
// Returns:
//   - A slice of Table objects.
//   - An error if the request fails.
func (c *Client) GetTables(ctx context.Context) ([]Table, error) {
	c.logger.Info("Getting tables from Armada server", zap.String("address", c.address))

	// Get connection from pool
	serverConn, err := c.connectionPool.GetConnection(ctx, c.address)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Armada server: %w", err)
	}

	// Create a list tables request
	req := &regattapb.ListTablesRequest{}

	// Call the List method of the Tables service
	resp, err := serverConn.TablesClient.List(ctx, req)
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
func (c *Client) CreateTable(ctx context.Context, tableName string) (string, error) {
	c.logger.Info("Creating table",
		zap.String("tableName", tableName),
		zap.String("address", c.address))

	// Get connection from pool
	serverConn, err := c.connectionPool.GetConnection(ctx, c.address)
	if err != nil {
		return "", fmt.Errorf("failed to connect to Armada server: %w", err)
	}

	// Create a create table request
	req := &regattapb.CreateTableRequest{
		Name: tableName,
	}

	// Call the Create method of the Tables service
	resp, err := serverConn.TablesClient.Create(ctx, req)
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
func (c *Client) DeleteTable(ctx context.Context, tableName string) error {
	c.logger.Info("Deleting table",
		zap.String("tableName", tableName),
		zap.String("address", c.address))

	// Get connection from pool
	serverConn, err := c.connectionPool.GetConnection(ctx, c.address)
	if err != nil {
		return fmt.Errorf("failed to connect to Armada server: %w", err)
	}

	// Create a delete table request
	req := &regattapb.DeleteTableRequest{
		Name: tableName,
	}

	// Call the Delete method of the Tables service
	_, err = serverConn.TablesClient.Delete(ctx, req)
	if err != nil {
		c.logger.Error("Failed to delete table",
			zap.Error(err),
			zap.String("tableName", tableName))
		return err
	}

	return nil
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
func (c *Client) GetKeyValuePairs(ctx context.Context, table, prefix, start, end string, limit int) ([]KeyValuePair, error) {
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

	// Get connection from pool
	serverConn, err := c.connectionPool.GetConnection(ctx, c.address)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Armada server: %w", err)
	}

	// Create a range request with the appropriate parameters
	req := &regattapb.RangeRequest{
		Table:    []byte(table),
		Key:      []byte(rangeStart),
		RangeEnd: []byte(rangeEnd),
		Limit:    int64(limit),
	}

	// Call the Range method of the KV service
	resp, err := serverConn.KVClient.Range(ctx, req)
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
func (c *Client) GetKeyValue(ctx context.Context, table, key string) (*KeyValuePair, error) {
	c.logger.Info("Getting specific key-value pair",
		zap.String("table", table),
		zap.String("key", key),
		zap.String("address", c.address))

	// Get connection from pool
	serverConn, err := c.connectionPool.GetConnection(ctx, c.address)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Armada server: %w", err)
	}

	// Create a range request with exact key match (no range)
	req := &regattapb.RangeRequest{
		Table: []byte(table),
		Key:   []byte(key),
		// Leave RangeEnd empty for exact key lookup
		Limit: 1, // We only need one key
	}

	// Call the Range method of the KV service
	resp, err := serverConn.KVClient.Range(ctx, req)
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
func (c *Client) PutKeyValue(ctx context.Context, table, key, value string) error {
	c.logger.Info("Putting key-value pair",
		zap.String("key", key),
		zap.String("value", value),
		zap.String("table", table),
		zap.String("address", c.address))

	// Get connection from pool
	serverConn, err := c.connectionPool.GetConnection(ctx, c.address)
	if err != nil {
		return fmt.Errorf("failed to connect to Armada server: %w", err)
	}

	// Create a put request
	req := &regattapb.PutRequest{
		Table: []byte(table),
		Key:   []byte(key),
		Value: []byte(value),
	}

	// Call the Put method of the KV service
	_, err = serverConn.KVClient.Put(ctx, req)
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
func (c *Client) DeleteKey(ctx context.Context, table, key string) error {
	c.logger.Info("Deleting key",
		zap.String("key", key),
		zap.String("table", table),
		zap.String("address", c.address))

	// Get connection from pool
	serverConn, err := c.connectionPool.GetConnection(ctx, c.address)
	if err != nil {
		return fmt.Errorf("failed to connect to Armada server: %w", err)
	}

	// Create a delete range request
	req := &regattapb.DeleteRangeRequest{
		Table: []byte(table),
		Key:   []byte(key),
	}

	// Call the DeleteRange method of the KV service
	_, err = serverConn.KVClient.DeleteRange(ctx, req)
	if err != nil {
		c.logger.Error("Failed to delete key from Armada server",
			zap.Error(err),
			zap.String("table", table),
			zap.String("key", key))
		return err
	}

	return nil
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

// GetMetrics retrieves all Prometheus metrics from the Armada server.
// It calls the GetMetrics method of the Metrics gRPC service.
//
// Parameters:
//   - ctx: The context for the request.
//   - format: Optional format specification (default is Prometheus text format).
//
// Returns:
//   - The metrics data and collection timestamp.
//   - An error if the request fails.
func (c *Client) GetMetrics(ctx context.Context, format string) (*MetricsData, error) {
	c.logger.Info("Getting metrics from Armada server",
		zap.String("address", c.address),
		zap.String("format", format))

	// Get connection from pool
	serverConn, err := c.connectionPool.GetConnection(ctx, c.address)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Armada server: %w", err)
	}

	req := &regattapb.MetricsRequest{
		Format: format,
	}

	resp, err := serverConn.MetricsClient.GetMetrics(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to get metrics: %w", err)
	}

	return &MetricsData{
		Data:      resp.MetricsData,
		Timestamp: time.Unix(resp.Timestamp, 0),
	}, nil
}

// Close closes the connection to the Armada server.
// It should be called when the client is no longer needed to free up resources.
//
// Returns:
//   - An error if the connection could not be closed properly.
func (c *Client) Close() error {
	c.logger.Info("Closing all connections", zap.String("address", c.address))
	return c.connectionPool.Close()
}
