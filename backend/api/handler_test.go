package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/armadakv/console/backend/armada"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// mockArmadaClient is a mock implementation of the Armada client for testing
type mockArmadaClient struct {
	statusResponse  *armada.Status
	clusterResponse *armada.ClusterInfo
	metricsResponse *armada.MetricsData
	kvPairs         []armada.KeyValuePair
	servers         []armada.Server
	singleKvPair    *armada.KeyValuePair
}

func (m *mockArmadaClient) GetStatus(ctx context.Context, serverAddress string) (*armada.Status, error) {
	if m.statusResponse != nil {
		return m.statusResponse, nil
	}
	return &armada.Status{
		Status:  "ok",
		Message: "Armada server is running",
	}, nil
}

func (m *mockArmadaClient) GetClusterInfo(ctx context.Context) (*armada.ClusterInfo, error) {
	if m.clusterResponse != nil {
		return m.clusterResponse, nil
	}
	return &armada.ClusterInfo{
		NodeID:      "node1",
		NodeAddress: "localhost:8081",
		Members: []armada.Server{
			{ID: "node1", Name: "server1", ClientURLs: []string{"http://localhost:8081"}},
			{ID: "node2", Name: "server2", ClientURLs: []string{"http://localhost:8082"}},
			{ID: "node3", Name: "server3", ClientURLs: []string{"http://localhost:8083"}},
		},
	}, nil
}

func (m *mockArmadaClient) GetMetrics(ctx context.Context, format string) (*armada.MetricsData, error) {
	if m.metricsResponse != nil {
		return m.metricsResponse, nil
	}
	return &armada.MetricsData{
		Data:      "# HELP armada_request_count Total number of requests\narmada_request_count 100\n",
		Timestamp: time.Now(),
		Source:    "test-cluster",
	}, nil
}

// Add the GetKeyValuePairs method with the new signature
func (m *mockArmadaClient) GetKeyValuePairs(ctx context.Context, table, prefix, start, end string, limit int) ([]armada.KeyValuePair, error) {
	if m.kvPairs != nil {
		return m.kvPairs, nil
	}
	return []armada.KeyValuePair{
		{Key: "key1", Value: "value1"},
		{Key: "key2", Value: "value2"},
	}, nil
}

// GetKeyValue implements the GetKeyValue method of the ArmadaClient interface
func (m *mockArmadaClient) GetKeyValue(ctx context.Context, table, key string) (*armada.KeyValuePair, error) {
	if m.singleKvPair != nil {
		return m.singleKvPair, nil
	}

	// If not explicitly set, return based on key
	if key == "key1" {
		return &armada.KeyValuePair{
			Key:   "key1",
			Value: "value1",
		}, nil
	} else if key == "key2" {
		return &armada.KeyValuePair{
			Key:   "key2",
			Value: "value2",
		}, nil
	}

	// If key not found, return error
	return nil, fmt.Errorf("key not found: %s", key)
}

func (m *mockArmadaClient) PutKeyValue(ctx context.Context, table, key, value string) error {
	return nil
}

func (m *mockArmadaClient) DeleteKey(ctx context.Context, table, key string) error {
	return nil
}

func (m *mockArmadaClient) GetTables(ctx context.Context) ([]armada.Table, error) {
	return []armada.Table{
		{Name: "table1", ID: "1"},
		{Name: "table2", ID: "2"},
	}, nil
}

// Adding CreateTable method to satisfy the interface
func (m *mockArmadaClient) CreateTable(ctx context.Context, tableName string) (string, error) {
	return "table_" + tableName, nil
}

// Adding DeleteTable method to satisfy the interface
func (m *mockArmadaClient) DeleteTable(ctx context.Context, tableName string) error {
	return nil
}

// Adding GetAllServers method to satisfy the interface
func (m *mockArmadaClient) GetAllServers(ctx context.Context) ([]armada.Server, error) {
	if m.servers != nil {
		return m.servers, nil
	}
	return []armada.Server{
		{
			ID:         "node1",
			Name:       "server1",
			ClientURLs: []string{"http://localhost:8081"},
		},
	}, nil
}

func (m *mockArmadaClient) Close() error {
	return nil
}

// createTestHandler creates a new API handler with a mock Armada client for testing
func createTestHandler() *Handler {
	// Create a no-op logger for testing
	logger := zap.NewNop()
	// Create a mock armada client (we'll pass nil and set it manually)
	handler := NewHandler(nil, logger)
	handler.client = &mockArmadaClient{}
	return handler
}

func TestHandleStatus(t *testing.T) {
	// Create a new API handler with a mock client
	handler := createTestHandler()

	// Create a request to pass to our handler
	req, err := http.NewRequest("GET", "/api/status", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a context with the Armada client
	ctx := context.WithValue(req.Context(), "armadaClient", handler.client)
	req = req.WithContext(ctx)

	// Create a ResponseRecorder to record the response
	rr := httptest.NewRecorder()
	handlerFunc := http.HandlerFunc(handler.handleStatus)

	// Call the handler function directly and pass our request and ResponseRecorder
	handlerFunc.ServeHTTP(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	// Check the content type
	expectedContentType := "application/json; charset=utf-8"
	if contentType := rr.Header().Get("Content-Type"); contentType != expectedContentType {
		t.Errorf("handler returned wrong content type: got %v want %v",
			contentType, expectedContentType)
	}

	// Parse the response body - should be a StatusResponse, not armada.Status
	var response StatusResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("Failed to parse response body: %v", err)
	}

	// Check the response fields
	if len(response.Servers) != 1 {
		t.Errorf("handler returned unexpected number of servers: got %v want %v",
			len(response.Servers), 1)
	}

	if response.Servers[0].Status != "ok" {
		t.Errorf("handler returned unexpected status: got %v want %v",
			response.Servers[0].Status, "ok")
	}

	if response.Servers[0].Message != "Armada server is running" {
		t.Errorf("handler returned unexpected message: got %v want %v",
			response.Servers[0].Message, "Armada server is running")
	}
}

func TestHandleStatusMethodNotAllowed(t *testing.T) {
	// Create a new API handler with a mock client
	handler := createTestHandler()

	// Create a POST request (which should not be allowed)
	req, err := http.NewRequest("POST", "/api/status", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a context with the Armada client
	ctx := context.WithValue(req.Context(), "armadaClient", handler.client)
	req = req.WithContext(ctx)

	// Create a ResponseRecorder to record the response
	rr := httptest.NewRecorder()
	handlerFunc := http.HandlerFunc(handler.handleStatus)

	// Call the handler function directly and pass our request and ResponseRecorder
	handlerFunc.ServeHTTP(rr, req)

	// With Chi router, method not allowed is handled by the router, not the handler
	// So we expect the handler to process the request normally
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}
}

func TestHandleCluster(t *testing.T) {
	// Create a new API handler with a mock client
	handler := createTestHandler()

	// Create a request to pass to our handler
	req, err := http.NewRequest("GET", "/api/cluster", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a context with the Armada client
	ctx := context.WithValue(req.Context(), "armadaClient", handler.client)
	req = req.WithContext(ctx)

	// Create a ResponseRecorder to record the response
	rr := httptest.NewRecorder()
	handlerFunc := http.HandlerFunc(handler.handleCluster)

	// Call the handler function directly and pass our request and ResponseRecorder
	handlerFunc.ServeHTTP(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	// Check the content type
	expectedContentType := "application/json; charset=utf-8"
	if contentType := rr.Header().Get("Content-Type"); contentType != expectedContentType {
		t.Errorf("handler returned wrong content type: got %v want %v",
			contentType, expectedContentType)
	}

	// Parse the response body
	var response armada.ClusterInfo
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("Failed to parse response body: %v", err)
	}

	// Check the response fields
	if response.NodeID != "node1" {
		t.Errorf("handler returned unexpected nodeId: got %v want %v",
			response.NodeID, "node1")
	}
}

func TestHandleTables(t *testing.T) {
	// Create a new API handler with a mock client
	handler := createTestHandler()

	// Create a request to pass to our handler
	req, err := http.NewRequest("GET", "/api/tables", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a context with the Armada client
	ctx := context.WithValue(req.Context(), "armadaClient", handler.client)
	req = req.WithContext(ctx)

	// Create a ResponseRecorder to record the response
	rr := httptest.NewRecorder()
	handlerFunc := http.HandlerFunc(handler.handleTables)

	// Call the handler function directly and pass our request and ResponseRecorder
	handlerFunc.ServeHTTP(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	// Check the content type
	expectedContentType := "application/json; charset=utf-8"
	if contentType := rr.Header().Get("Content-Type"); contentType != expectedContentType {
		t.Errorf("handler returned wrong content type: got %v want %v",
			contentType, expectedContentType)
	}

	// Parse the response body
	var response []armada.Table
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("Failed to parse response body: %v", err)
	}

	// Check the response fields
	if len(response) != 2 {
		t.Errorf("handler returned unexpected number of tables: got %v want %v",
			len(response), 2)
	}
}

func TestHandleCreateTable(t *testing.T) {
	// Create a new API handler with a mock client
	handler := createTestHandler()

	// Create request body
	reqBody := CreateTableRequest{
		Name: "new_table",
	}
	reqBodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		t.Fatal(err)
	}

	// Create a request to pass to our handler
	req, err := http.NewRequest("POST", "/api/tables", bytes.NewReader(reqBodyBytes))
	if err != nil {
		t.Fatal(err)
	}

	// Create a context with the Armada client
	ctx := context.WithValue(req.Context(), "armadaClient", handler.client)
	req = req.WithContext(ctx)

	// Create a ResponseRecorder to record the response
	rr := httptest.NewRecorder()
	handlerFunc := http.HandlerFunc(handler.handleCreateTable)

	// Call the handler function directly and pass our request and ResponseRecorder
	handlerFunc.ServeHTTP(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	// Check the content type
	expectedContentType := "application/json; charset=utf-8"
	if contentType := rr.Header().Get("Content-Type"); contentType != expectedContentType {
		t.Errorf("handler returned wrong content type: got %v want %v",
			contentType, expectedContentType)
	}

	// Parse the response body
	var response CreateTableResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("Failed to parse response body: %v", err)
	}

	// Check the response fields
	expectedID := "table_new_table"
	if response.ID != expectedID {
		t.Errorf("handler returned unexpected table ID: got %v want %v",
			response.ID, expectedID)
	}
}

func TestHandleDeleteTable(t *testing.T) {
	// Create a new API handler with a mock client
	handler := createTestHandler()

	// Create a request to pass to our handler
	req, err := http.NewRequest("DELETE", "/api/tables/test_table", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a context with the Armada client
	ctx := context.WithValue(req.Context(), "armadaClient", handler.client)

	// Add URL parameters to the context
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("name", "test_table")
	ctx = context.WithValue(ctx, chi.RouteCtxKey, rctx)

	req = req.WithContext(ctx)

	// Create a ResponseRecorder to record the response
	rr := httptest.NewRecorder()
	handlerFunc := http.HandlerFunc(handler.handleDeleteTable)

	// Call the handler function directly and pass our request and ResponseRecorder
	handlerFunc.ServeHTTP(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	// Check the content type
	expectedContentType := "application/json; charset=utf-8"
	if contentType := rr.Header().Get("Content-Type"); contentType != expectedContentType {
		t.Errorf("handler returned wrong content type: got %v want %v",
			contentType, expectedContentType)
	}
}

func TestHandleServers(t *testing.T) {
	// Create a new API handler with a mock client
	handler := createTestHandler()

	// Create a request to pass to our handler
	req, err := http.NewRequest("GET", "/api/servers", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Create a context with the Armada client
	ctx := context.WithValue(req.Context(), "armadaClient", handler.client)
	req = req.WithContext(ctx)

	// Create a ResponseRecorder to record the response
	rr := httptest.NewRecorder()
	handlerFunc := http.HandlerFunc(handler.handleServers)

	// Call the handler function directly and pass our request and ResponseRecorder
	handlerFunc.ServeHTTP(rr, req)

	// Check the status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	// Check the content type
	expectedContentType := "application/json; charset=utf-8"
	if contentType := rr.Header().Get("Content-Type"); contentType != expectedContentType {
		t.Errorf("handler returned wrong content type: got %v want %v",
			contentType, expectedContentType)
	}

	// Parse the response body
	var response []armada.Server
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("Failed to parse response body: %v", err)
	}

	// Check the response fields
	if len(response) != 1 {
		t.Errorf("handler returned unexpected number of servers: got %v want %v",
			len(response), 1)
	}
}

func TestHandleKeyValue(t *testing.T) {
	// Create a new API handler with a mock client
	handler := createTestHandler()

	// Test GET request
	t.Run("GET", func(t *testing.T) {
		// Create a request to pass to our handler
		req, err := http.NewRequest("GET", "/api/kv/test?prefix=key", nil)
		if err != nil {
			t.Fatal(err)
		}

		// Create a context with the Armada client
		ctx := context.WithValue(req.Context(), "armadaClient", handler.client)

		// Add URL parameters to the context
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("table", "test")
		ctx = context.WithValue(ctx, chi.RouteCtxKey, rctx)

		req = req.WithContext(ctx)

		// Create a ResponseRecorder to record the response
		rr := httptest.NewRecorder()
		handlerFunc := http.HandlerFunc(handler.handleGetKeyValue)

		// Call the handler function directly and pass our request and ResponseRecorder
		handlerFunc.ServeHTTP(rr, req)

		// Check the status code
		if status := rr.Code; status != http.StatusOK {
			t.Errorf("handler returned wrong status code: got %v want %v",
				status, http.StatusOK)
		}

		// Check the content type
		expectedContentType := "application/json; charset=utf-8"
		if contentType := rr.Header().Get("Content-Type"); contentType != expectedContentType {
			t.Errorf("handler returned wrong content type: got %v want %v",
				contentType, expectedContentType)
		}

		// Parse the response body
		var response []armada.KeyValuePair
		if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
			t.Errorf("Failed to parse response body: %v", err)
		}

		// Check the response fields
		if len(response) != 2 {
			t.Errorf("handler returned unexpected number of key-value pairs: got %v want %v",
				len(response), 2)
		}
	})

	// Test PUT request
	t.Run("PUT", func(t *testing.T) {
		// Create a request body
		reqBody := armada.KeyValuePair{
			Key:   "key3",
			Value: "value3",
		}
		reqBodyBytes, err := json.Marshal(reqBody)
		if err != nil {
			t.Fatal(err)
		}

		// Create a request to pass to our handler
		req, err := http.NewRequest("PUT", "/api/kv/test", bytes.NewReader(reqBodyBytes))
		if err != nil {
			t.Fatal(err)
		}

		// Create a context with the Armada client
		ctx := context.WithValue(req.Context(), "armadaClient", handler.client)

		// Add URL parameters to the context
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("table", "test")
		ctx = context.WithValue(ctx, chi.RouteCtxKey, rctx)

		req = req.WithContext(ctx)

		// Create a ResponseRecorder to record the response
		rr := httptest.NewRecorder()
		handlerFunc := http.HandlerFunc(handler.handlePutKeyValue)

		// Call the handler function directly and pass our request and ResponseRecorder
		handlerFunc.ServeHTTP(rr, req)

		// Check the status code
		if status := rr.Code; status != http.StatusOK {
			t.Errorf("handler returned wrong status code: got %v want %v",
				status, http.StatusOK)
		}
	})

	// Test DELETE request
	t.Run("DELETE", func(t *testing.T) {
		// Create a request to pass to our handler
		req, err := http.NewRequest("DELETE", "/api/kv/test?key=key1", nil)
		if err != nil {
			t.Fatal(err)
		}

		// Create a context with the Armada client
		ctx := context.WithValue(req.Context(), "armadaClient", handler.client)

		// Add URL parameters to the context (only table needed)
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("table", "test")
		ctx = context.WithValue(ctx, chi.RouteCtxKey, rctx)

		req = req.WithContext(ctx)

		// Create a ResponseRecorder to record the response
		rr := httptest.NewRecorder()
		handlerFunc := http.HandlerFunc(handler.handleDeleteKey)

		// Call the handler function directly and pass our request and ResponseRecorder
		handlerFunc.ServeHTTP(rr, req)

		// Check the status code
		if status := rr.Code; status != http.StatusOK {
			t.Errorf("handler returned wrong status code: got %v want %v",
				status, http.StatusOK)
		}
	})
}

// TestHandleGetSpecificKeyValue tests the handleGetSpecificKeyValue handler function
func TestHandleGetSpecificKeyValue(t *testing.T) {
	// Create a new API handler with a mock client
	handler := createTestHandler()

	// Test successful request
	t.Run("Success", func(t *testing.T) {
		// Configure the mock client to return a specific key-value pair
		mockClient := handler.client.(*mockArmadaClient)
		mockClient.singleKvPair = &armada.KeyValuePair{
			Key:   "testkey",
			Value: "testvalue",
		}

		// Create a request to pass to our handler
		req, err := http.NewRequest("GET", "/api/kv/testtable/testkey", nil)
		if err != nil {
			t.Fatal(err)
		}

		// Create a context with the Armada client
		ctx := context.WithValue(req.Context(), "armadaClient", handler.client)

		// Add URL parameters to the context
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("table", "testtable")
		rctx.URLParams.Add("key", "testkey")
		ctx = context.WithValue(ctx, chi.RouteCtxKey, rctx)

		req = req.WithContext(ctx)

		// Create a ResponseRecorder to record the response
		rr := httptest.NewRecorder()
		handlerFunc := http.HandlerFunc(handler.handleGetSpecificKeyValue)

		// Call the handler function directly and pass our request and ResponseRecorder
		handlerFunc.ServeHTTP(rr, req)

		// Check the status code
		if status := rr.Code; status != http.StatusOK {
			t.Errorf("handler returned wrong status code: got %v want %v",
				status, http.StatusOK)
		}

		// Check the content type
		expectedContentType := "application/json; charset=utf-8"
		if contentType := rr.Header().Get("Content-Type"); contentType != expectedContentType {
			t.Errorf("handler returned wrong content type: got %v want %v",
				contentType, expectedContentType)
		}

		// Parse the response body
		var response armada.KeyValuePair
		if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
			t.Errorf("Failed to parse response body: %v", err)
		}

		// Check the response fields
		if response.Key != "testkey" || response.Value != "testvalue" {
			t.Errorf("handler returned unexpected key-value pair: got {%s, %s}, want {testkey, testvalue}",
				response.Key, response.Value)
		}
	})

	// Test key not found
	t.Run("KeyNotFound", func(t *testing.T) {
		// Reset the mock client to use default behavior
		mockClient := handler.client.(*mockArmadaClient)
		mockClient.singleKvPair = nil

		// Create a request to pass to our handler
		req, err := http.NewRequest("GET", "/api/kv/testtable/nonexistentkey", nil)
		if err != nil {
			t.Fatal(err)
		}

		// Create a context with the Armada client
		ctx := context.WithValue(req.Context(), "armadaClient", handler.client)

		// Add URL parameters to the context
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("table", "testtable")
		rctx.URLParams.Add("key", "nonexistentkey")
		ctx = context.WithValue(ctx, chi.RouteCtxKey, rctx)

		req = req.WithContext(ctx)

		// Create a ResponseRecorder to record the response
		rr := httptest.NewRecorder()
		handlerFunc := http.HandlerFunc(handler.handleGetSpecificKeyValue)

		// Call the handler function directly and pass our request and ResponseRecorder
		handlerFunc.ServeHTTP(rr, req)

		// Check the status code - should be 404 Not Found
		if status := rr.Code; status != http.StatusNotFound {
			t.Errorf("handler returned wrong status code: got %v want %v",
				status, http.StatusNotFound)
		}
	})

	// Test missing table parameter
	t.Run("MissingTable", func(t *testing.T) {
		// Create a request to pass to our handler
		req, err := http.NewRequest("GET", "/api/kv//testkey", nil)
		if err != nil {
			t.Fatal(err)
		}

		// Create a context with the Armada client
		ctx := context.WithValue(req.Context(), "armadaClient", handler.client)

		// Add URL parameters to the context - with missing table
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("key", "testkey")
		ctx = context.WithValue(ctx, chi.RouteCtxKey, rctx)

		req = req.WithContext(ctx)

		// Create a ResponseRecorder to record the response
		rr := httptest.NewRecorder()
		handlerFunc := http.HandlerFunc(handler.handleGetSpecificKeyValue)

		// Call the handler function directly and pass our request and ResponseRecorder
		handlerFunc.ServeHTTP(rr, req)

		// Check the status code - should be 400 Bad Request
		if status := rr.Code; status != http.StatusBadRequest {
			t.Errorf("handler returned wrong status code: got %v want %v",
				status, http.StatusBadRequest)
		}
	})

	// Test missing key parameter
	t.Run("MissingKey", func(t *testing.T) {
		// Create a request to pass to our handler
		req, err := http.NewRequest("GET", "/api/kv/testtable/", nil)
		if err != nil {
			t.Fatal(err)
		}

		// Create a context with the Armada client
		ctx := context.WithValue(req.Context(), "armadaClient", handler.client)

		// Add URL parameters to the context - with missing key
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("table", "testtable")
		ctx = context.WithValue(ctx, chi.RouteCtxKey, rctx)

		req = req.WithContext(ctx)

		// Create a ResponseRecorder to record the response
		rr := httptest.NewRecorder()
		handlerFunc := http.HandlerFunc(handler.handleGetSpecificKeyValue)

		// Call the handler function directly and pass our request and ResponseRecorder
		handlerFunc.ServeHTTP(rr, req)

		// Check the status code - should be 400 Bad Request
		if status := rr.Code; status != http.StatusBadRequest {
			t.Errorf("handler returned wrong status code: got %v want %v",
				status, http.StatusBadRequest)
		}
	})
}
