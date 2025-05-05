package api

import (
	"cmp"
	"context"
	"encoding/json"
	"net/http"
	"slices"
	"sync"
	"time"

	"github.com/armadakv/console/backend/armada"
	"github.com/go-chi/chi/v5"
	"github.com/go-rat/chix"
	"go.uber.org/zap"
)

// ArmadaClient is the interface for interacting with the Armada server.
// It provides methods for retrieving server status, cluster information,
// and performing key-value operations.
type ArmadaClient interface {
	// GetStatus retrieves the current status of the Armada server.
	// If serverAddress is provided, it will connect to that server to get the status.
	// Otherwise, it will use the client's default server address.
	// It returns a Status object containing the status and a message.
	GetStatus(ctx context.Context, serverAddress string) (*armada.Status, error)

	// GetClusterInfo retrieves information about the Armada cluster.
	// It returns a ClusterInfo object containing node IDs, addresses, and raft information.
	GetClusterInfo(ctx context.Context) (*armada.ClusterInfo, error)

	// GetAllServers retrieves information about all servers in the Armada cluster.
	// It returns a slice of Server objects containing server IDs, names, and URLs.
	GetAllServers(ctx context.Context) ([]armada.Server, error)

	// GetTables retrieves a list of all tables in the Armada server.
	// It returns a slice of Table objects.
	GetTables(ctx context.Context) ([]armada.Table, error)

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
	GetKeyValuePairs(ctx context.Context, table string, prefix string, start string, end string, limit int) ([]armada.KeyValuePair, error)

	// GetKeyValue retrieves a specific key-value pair from the specified table.
	// It returns the key-value pair if found, or an error if not found or if the operation fails.
	GetKeyValue(ctx context.Context, table string, key string) (*armada.KeyValuePair, error)

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

// ServerStatus represents the status of a single server
type ServerStatus struct {
	ID      string                        `json:"id"`
	Name    string                        `json:"name"`
	Status  string                        `json:"status"`
	Message string                        `json:"message"`
	Config  map[string]interface{}        `json:"config,omitempty"`
	Tables  map[string]armada.TableStatus `json:"tables,omitempty"`
	Errors  []string                      `json:"errors,omitempty"`
}

// StatusResponse represents the response for the status API endpoint
type StatusResponse struct {
	Servers []ServerStatus `json:"servers"`
}

// CreateTableRequest represents the request for the create table API endpoint
type CreateTableRequest struct {
	Name string `json:"name"`
}

// CreateTableResponse represents the response for the create table API endpoint
type CreateTableResponse struct {
	ID string `json:"id"`
}

// Handler is the main API handler that registers all API routes
type Handler struct {
	client     ArmadaClient
	clientLock sync.RWMutex
	armadaURL  string
	logger     *zap.Logger
}

// NewHandler creates a new API handler
func NewHandler(armadaURL string, logger *zap.Logger) *Handler {
	return &Handler{
		armadaURL: armadaURL,
		logger:    logger,
	}
}

// withArmadaClient is a middleware that adds the Armada client to the request context
func (h *Handler) withArmadaClient(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		client, err := h.getClient()
		if err != nil {
			h.logger.Error("Failed to get Armada client", zap.Error(err))
			http.Error(w, "Failed to connect to Armada server", http.StatusInternalServerError)
			return
		}

		// Create a context with timeout
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		// Add the client to the context
		ctx = context.WithValue(ctx, "armadaClient", client)

		// Call the next handler with the updated context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// getArmadaClientFromContext retrieves the Armada client from the request context
func getArmadaClientFromContext(r *http.Request) ArmadaClient {
	return r.Context().Value("armadaClient").(ArmadaClient)
}

// RegisterRoutes registers all API routes with the provided router
// It supports both standard http.ServeMux and Chi router
//
// Chi Router Benefits:
// - More expressive and flexible routing patterns
// - Built-in middleware support
// - Better request context management
// - Method-specific routing (GET, POST, PUT, DELETE, etc.)
// - Nested routes and subrouters
// - URL parameter extraction
// - Middleware scoping
//
// For more information on Chi, see: https://github.com/go-chi/chi
func (h *Handler) RegisterRoutes(r chi.Router) {
	// Create a subrouter with the Armada client middleware
	apiRouter := chi.NewRouter()
	apiRouter.Use(h.withArmadaClient)

	// Register API routes
	apiRouter.Get("/status", h.handleStatus)
	apiRouter.Get("/cluster", h.handleCluster)
	apiRouter.Get("/servers", h.handleServers)

	// Tables management
	apiRouter.Route("/tables", func(r chi.Router) {
		r.Get("/", h.handleTables)
		r.Post("/", h.handleCreateTable)
		r.Delete("/{name}", h.handleDeleteTable)
	})

	// Group related KV routes
	apiRouter.Route("/kv", func(r chi.Router) {
		// URL parameter extraction for table
		r.Route("/{table}", func(r chi.Router) {
			r.Get("/", h.handleGetKeyValue)
			r.Put("/", h.handlePutKeyValue)
			// URL parameter extraction for key
			r.Delete("/", h.handleDeleteKey)
			// Get a specific key-value pair by key
			r.Get("/{key}", h.handleGetSpecificKeyValue)
		})
	})

	// Mount the API router under /api
	r.Mount("/api", apiRouter)
}

// handleStatus handles the status API endpoint
func (h *Handler) handleStatus(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)
	render := chix.NewRender(w)

	// Get all servers from the Armada cluster
	servers, err := client.GetAllServers(r.Context())
	if err != nil {
		h.logger.Error("Failed to get servers from Armada cluster", zap.Error(err))
		http.Error(w, "Failed to get servers", http.StatusInternalServerError)
		return
	}

	// Create a response with statuses of all servers
	response := StatusResponse{
		Servers: make([]ServerStatus, 0, len(servers)),
	}

	// Get the status of each server individually
	for _, server := range servers {
		// Use the first PeerURL as the server address
		var serverAddress string
		if len(server.ClientURLs) > 0 {
			serverAddress = server.ClientURLs[0]
		}

		// Get the status of this server
		status, err := client.GetStatus(r.Context(), serverAddress)
		if err != nil {
			h.logger.Error("Failed to get status from Armada server",
				zap.Error(err),
				zap.String("serverID", server.ID),
				zap.String("serverAddress", serverAddress))

			// Add a fallback status for this server
			response.Servers = append(response.Servers, ServerStatus{
				ID:      server.ID,
				Name:    server.Name,
				Status:  "error",
				Message: "Failed to connect to Armada server: " + err.Error(),
			})
		} else {
			// Add the status for this server
			response.Servers = append(response.Servers, ServerStatus{
				ID:      server.ID,
				Name:    server.Name,
				Status:  status.Status,
				Message: status.Message,
				Config:  status.Config, // Include the config data
				Tables:  status.Tables, // Include the tables data
				Errors:  status.Errors, // Include the errors data
			})
		}
	}
	slices.SortFunc(response.Servers, func(e ServerStatus, e2 ServerStatus) int {
		return cmp.Compare(e.Name, e2.Name)
	})
	render.JSON(response)
}

// handleTables handles the tables API endpoint
func (h *Handler) handleTables(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)
	render := chix.NewRender(w)
	// Get the tables from the Armada server
	tables, err := client.GetTables(r.Context())
	if err != nil {
		h.logger.Error("Failed to get tables from Armada server", zap.Error(err))
		http.Error(w, "Failed to get tables", http.StatusInternalServerError)
		return
	}

	render.JSON(tables)
}

// handleCreateTable handles the create table API endpoint
func (h *Handler) handleCreateTable(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)
	render := chix.NewRender(w)

	// Parse the request body
	var req CreateTableRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate the table name
	if req.Name == "" {
		http.Error(w, "Table name is required", http.StatusBadRequest)
		return
	}

	// Create the table
	tableID, err := client.CreateTable(r.Context(), req.Name)
	if err != nil {
		h.logger.Error("Failed to create table",
			zap.Error(err),
			zap.String("tableName", req.Name))
		http.Error(w, "Failed to create table: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return the table ID
	render.JSON(CreateTableResponse{ID: tableID})
}

// handleDeleteTable handles the delete table API endpoint
func (h *Handler) handleDeleteTable(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)
	render := chix.NewRender(w)

	// Get the table name from the URL parameters
	tableName := chi.URLParam(r, "name")
	if tableName == "" {
		http.Error(w, "Table name is required", http.StatusBadRequest)
		return
	}

	// Delete the table
	err := client.DeleteTable(r.Context(), tableName)
	if err != nil {
		h.logger.Error("Failed to delete table",
			zap.Error(err),
			zap.String("tableName", tableName))
		http.Error(w, "Failed to delete table: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return an empty response
	render.JSON(make(map[string]any))
}

// handleGetKeyValue handles the GET method for the key-value API endpoint
func (h *Handler) handleGetKeyValue(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)
	render := chix.NewRender(w, r)
	// Get the table from the URL parameters
	table := chi.URLParam(r, "table")
	if table == "" {
		http.Error(w, "Table is required", http.StatusBadRequest)
		return
	}

	// Get filtering parameters from query
	prefix := r.URL.Query().Get("prefix")
	start := r.URL.Query().Get("start")
	end := r.URL.Query().Get("end")
	limit := 100 // Default limit

	// Validate parameters - we either need a prefix OR a start-end range (or neither for all keys)
	if prefix != "" && (start != "" || end != "") {
		http.Error(w, "Cannot specify both prefix and start/end range", http.StatusBadRequest)
		return
	}

	// If start is specified but end is not, return an error
	if start != "" && end == "" {
		http.Error(w, "Must provide both start and end for range filtering", http.StatusBadRequest)
		return
	}

	// If end is specified but start is not, return an error
	if end != "" && start == "" {
		http.Error(w, "Must provide both start and end for range filtering", http.StatusBadRequest)
		return
	}

	// Get key-value pairs with the specified filtering
	pairs, err := client.GetKeyValuePairs(r.Context(), table, prefix, start, end, limit)
	if err != nil {
		h.logger.Error("Failed to get key-value pairs",
			zap.Error(err),
			zap.String("table", table),
			zap.String("prefix", prefix),
			zap.String("start", start),
			zap.String("end", end))
		http.Error(w, "Failed to get key-value pairs", http.StatusInternalServerError)
		return
	}

	render.JSON(pairs)
}

// handlePutKeyValue handles the PUT method for the key-value API endpoint
func (h *Handler) handlePutKeyValue(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)
	render := chix.NewRender(w)
	// Get the table from the URL parameters
	table := chi.URLParam(r, "table")
	if table == "" {
		http.Error(w, "Table is required", http.StatusBadRequest)
		return
	}

	// Put a key-value pair
	var pair armada.KeyValuePair
	if err := json.NewDecoder(r.Body).Decode(&pair); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := client.PutKeyValue(r.Context(), table, pair.Key, pair.Value); err != nil {
		h.logger.Error("Failed to put key-value pair",
			zap.Error(err),
			zap.String("table", table),
			zap.String("key", pair.Key))
		http.Error(w, "Failed to put key-value pair", http.StatusInternalServerError)
		return
	}

	render.JSON(make(map[string]any))
}

// handleDeleteKey handles the DELETE method for the key-value API endpoint
func (h *Handler) handleDeleteKey(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)
	render := chix.NewRender(w)
	// Get the table and key from the URL parameters
	table := chi.URLParam(r, "table")
	if table == "" {
		http.Error(w, "Table is required", http.StatusBadRequest)
		return
	}

	key := r.URL.Query().Get("key")
	if key == "" {
		http.Error(w, "Key is required", http.StatusBadRequest)
		return
	}

	if err := client.DeleteKey(r.Context(), table, key); err != nil {
		h.logger.Error("Failed to delete key",
			zap.Error(err),
			zap.String("table", table),
			zap.String("key", key))
		http.Error(w, "Failed to delete key", http.StatusInternalServerError)
		return
	}

	render.JSON(make(map[string]any))
}

// handleGetSpecificKeyValue handles the GET method for retrieving a specific key-value pair
func (h *Handler) handleGetSpecificKeyValue(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)
	render := chix.NewRender(w)

	// Get the table and key from the URL parameters
	table := chi.URLParam(r, "table")
	if table == "" {
		http.Error(w, "Table is required", http.StatusBadRequest)
		return
	}

	key := chi.URLParam(r, "key")
	if key == "" {
		http.Error(w, "Key is required", http.StatusBadRequest)
		return
	}

	// Get the specific key-value pair
	pair, err := client.GetKeyValue(r.Context(), table, key)
	if err != nil {
		h.logger.Error("Failed to get key-value pair",
			zap.Error(err),
			zap.String("table", table),
			zap.String("key", key))
		http.Error(w, "Failed to get key-value pair: "+err.Error(), http.StatusNotFound)
		return
	}

	render.JSON(pair)
}

// handleCluster handles the cluster API endpoint
func (h *Handler) handleCluster(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)
	render := chix.NewRender(w)
	// Get the cluster info from the Armada server
	clusterInfo, err := client.GetClusterInfo(r.Context())
	if err != nil {
		h.logger.Error("Failed to get cluster info from Armada server", zap.Error(err))
		http.Error(w, "Failed to get cluster info", http.StatusInternalServerError)
		return
	}

	render.JSON(clusterInfo)
}

// handleServers handles the servers API endpoint
func (h *Handler) handleServers(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)
	render := chix.NewRender(w)
	// Get all servers from the Armada cluster
	servers, err := client.GetAllServers(r.Context())
	if err != nil {
		h.logger.Error("Failed to get servers from Armada cluster", zap.Error(err))
		http.Error(w, "Failed to get servers", http.StatusInternalServerError)
		return
	}

	render.JSON(servers)
}

// getClient returns the Armada client, creating it if necessary
func (h *Handler) getClient() (ArmadaClient, error) {
	h.clientLock.RLock()
	client := h.client
	h.clientLock.RUnlock()

	if client != nil {
		return client, nil
	}

	// Create a new client
	h.clientLock.Lock()
	defer h.clientLock.Unlock()

	// Check again in case another goroutine created the client
	if h.client != nil {
		return h.client, nil
	}

	client, err := armada.NewClient(h.armadaURL, h.logger)
	if err != nil {
		return nil, err
	}

	h.client = client
	return client, nil
}
