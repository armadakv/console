package api

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/armadakv/console/backend/armada"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// ServerStatus represents the status of a single server
type ServerStatus struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

// StatusResponse represents the response for the status API endpoint
type StatusResponse struct {
	Servers []ServerStatus `json:"servers"`
}

// Handler is the main API handler that registers all API routes
type Handler struct {
	client     armada.ArmadaClient
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
func getArmadaClientFromContext(r *http.Request) armada.ArmadaClient {
	return r.Context().Value("armadaClient").(armada.ArmadaClient)
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
	apiRouter.Get("/metrics", h.handleMetrics)
	apiRouter.Get("/tables", h.handleTables)

	// Group related KV routes
	apiRouter.Route("/kv", func(r chi.Router) {
		// URL parameter extraction for table
		r.Route("/{table}", func(r chi.Router) {
			r.Get("/", h.handleGetKeyValue)
			r.Put("/", h.handlePutKeyValue)
			// URL parameter extraction for key
			r.Delete("/", h.handleDeleteKey)
		})
	})

	// Mount the API router under /api
	r.Mount("/api", apiRouter)
}

// handleStatus handles the status API endpoint
func (h *Handler) handleStatus(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)

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
			})
		}
	}

	// Set content type and encode response as JSON
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// handleTables handles the tables API endpoint
func (h *Handler) handleTables(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)

	// Get the tables from the Armada server
	tables, err := client.GetTables(r.Context())
	if err != nil {
		h.logger.Error("Failed to get tables from Armada server", zap.Error(err))
		http.Error(w, "Failed to get tables", http.StatusInternalServerError)
		return
	}

	// Set content type and encode response as JSON
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(tables); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// handleGetKeyValue handles the GET method for the key-value API endpoint
func (h *Handler) handleGetKeyValue(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)

	// Get the table from the URL parameters
	table := chi.URLParam(r, "table")
	if table == "" {
		http.Error(w, "Table is required", http.StatusBadRequest)
		return
	}

	// Get key-value pairs
	prefix := r.URL.Query().Get("prefix")
	limit := 100 // Default limit
	pairs, err := client.GetKeyValuePairs(r.Context(), table, prefix, limit)
	if err != nil {
		h.logger.Error("Failed to get key-value pairs",
			zap.Error(err),
			zap.String("table", table),
			zap.String("prefix", prefix))
		http.Error(w, "Failed to get key-value pairs", http.StatusInternalServerError)
		return
	}

	// Set content type and encode response as JSON
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(pairs); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// handlePutKeyValue handles the PUT method for the key-value API endpoint
func (h *Handler) handlePutKeyValue(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)

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

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(make(map[string]any)); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// handleDeleteKey handles the DELETE method for the key-value API endpoint
func (h *Handler) handleDeleteKey(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)

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

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(make(map[string]any)); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// handleCluster handles the cluster API endpoint
func (h *Handler) handleCluster(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)

	// Get the cluster info from the Armada server
	clusterInfo, err := client.GetClusterInfo(r.Context())
	if err != nil {
		h.logger.Error("Failed to get cluster info from Armada server", zap.Error(err))
		http.Error(w, "Failed to get cluster info", http.StatusInternalServerError)
		return
	}

	// Set content type and encode response as JSON
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(clusterInfo); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// handleMetrics handles the metrics API endpoint
func (h *Handler) handleMetrics(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)

	// Get the metrics from the Armada server
	metrics, err := client.GetMetrics(r.Context())
	if err != nil {
		h.logger.Error("Failed to get metrics from Armada server", zap.Error(err))
		http.Error(w, "Failed to get metrics", http.StatusInternalServerError)
		return
	}

	// Set content type and encode response as JSON
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(metrics); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// handleServers handles the servers API endpoint
func (h *Handler) handleServers(w http.ResponseWriter, r *http.Request) {
	// Get the Armada client from the request context
	client := getArmadaClientFromContext(r)

	// Get all servers from the Armada cluster
	servers, err := client.GetAllServers(r.Context())
	if err != nil {
		h.logger.Error("Failed to get servers from Armada cluster", zap.Error(err))
		http.Error(w, "Failed to get servers", http.StatusInternalServerError)
		return
	}

	// Set content type and encode response as JSON
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(servers); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// getClient returns the Armada client, creating it if necessary
func (h *Handler) getClient() (armada.ArmadaClient, error) {
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
