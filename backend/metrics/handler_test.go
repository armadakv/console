package metrics

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/prometheus/prometheus/promql/parser"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
)

// mockMetricsManager implements a mock metrics manager for testing
type mockMetricsManager struct {
	mock.Mock
}

func (m *mockMetricsManager) GetStorage() interface{} {
	args := m.Called()
	return args.Get(0)
}

// mockQueryEngine implements a mock query engine for testing
type mockQueryEngine struct {
	mock.Mock
}

func (m *mockQueryEngine) Query(ctx context.Context, query string, ts time.Time) (*QueryResult, error) {
	args := m.Called(ctx, query, ts)
	return args.Get(0).(*QueryResult), args.Error(1)
}

func (m *mockQueryEngine) QueryRange(ctx context.Context, query string, start, end time.Time, step time.Duration) (*QueryResult, error) {
	args := m.Called(ctx, query, start, end, step)
	return args.Get(0).(*QueryResult), args.Error(1)
}

func TestNewMetricsHandler(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "handler_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	// Create a real metrics manager for this test
	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	handler := NewMetricsHandler(manager, logger)

	assert.NotNil(t, handler)
	assert.NotNil(t, handler.logger)
	assert.Equal(t, manager, handler.metricsManager)
	assert.NotNil(t, handler.queryEngine)
}

func TestNewMetricsHandlerWithNilLogger(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "handler_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	mockPool := &mockClusterPool{}

	// Create a real metrics manager for this test
	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, zap.NewNop())
	assert.NoError(t, err)
	defer manager.Stop()

	handler := NewMetricsHandler(manager, nil)

	assert.NotNil(t, handler)
	assert.NotNil(t, handler.logger) // Should create a no-op logger
}

func TestMetricsHandlerRegisterRoutes(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "handler_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	handler := NewMetricsHandler(manager, logger)

	router := chi.NewRouter()
	handler.RegisterRoutes(router)

	// Test that routes are registered by making requests
	testCases := []struct {
		method string
		path   string
	}{
		{"GET", "/api/metrics/query"},
		{"GET", "/api/metrics/query_range"},
	}

	for _, tc := range testCases {
		req := httptest.NewRequest(tc.method, tc.path, nil)
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)

		// Should not return 404 (route not found)
		assert.NotEqual(t, http.StatusNotFound, rr.Code, "Route %s %s should be registered", tc.method, tc.path)
	}
}

func TestHandleQueryMissingParameter(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "handler_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	handler := NewMetricsHandler(manager, logger)

	req := httptest.NewRequest("GET", "/api/metrics/query", nil)
	rr := httptest.NewRecorder()

	handler.handleQuery(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)

	var response map[string]interface{}
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Missing required parameter 'query'", response["error"])
}

func TestHandleQueryWithValidQuery(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "handler_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	handler := NewMetricsHandler(manager, logger)

	req := httptest.NewRequest("GET", "/api/metrics/query?query=up", nil)
	rr := httptest.NewRecorder()

	handler.handleQuery(rr, req)

	// The query will likely fail due to no data, but we should get a proper response structure
	assert.True(t, rr.Code == http.StatusOK || rr.Code == http.StatusInternalServerError)

	var response map[string]interface{}
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, []string{"success", "error"}, response["status"])
}

func TestHandleQueryWithTime(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "handler_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	handler := NewMetricsHandler(manager, logger)

	// Test with RFC3339 time
	req := httptest.NewRequest("GET", "/api/metrics/query?query=up&time=2023-01-01T12:00:00Z", nil)
	rr := httptest.NewRecorder()

	handler.handleQuery(rr, req)

	assert.True(t, rr.Code == http.StatusOK || rr.Code == http.StatusInternalServerError)

	// Test with unix timestamp
	req = httptest.NewRequest("GET", "/api/metrics/query?query=up&time=1672574400", nil)
	rr = httptest.NewRecorder()

	handler.handleQuery(rr, req)

	assert.True(t, rr.Code == http.StatusOK || rr.Code == http.StatusInternalServerError)
}

func TestHandleQueryWithInvalidTime(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "handler_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	handler := NewMetricsHandler(manager, logger)

	req := httptest.NewRequest("GET", "/api/metrics/query?query=up&time=invalid", nil)
	rr := httptest.NewRecorder()

	handler.handleQuery(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)

	var response map[string]interface{}
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "error", response["status"])
	assert.Contains(t, response["error"].(string), "Invalid time format")
}

func TestHandleQueryRangeMissingParameters(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "handler_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	handler := NewMetricsHandler(manager, logger)

	// Missing query
	req := httptest.NewRequest("GET", "/api/metrics/query_range", nil)
	rr := httptest.NewRecorder()
	handler.handleQueryRange(rr, req)
	assert.Equal(t, http.StatusBadRequest, rr.Code)

	// Missing start
	req = httptest.NewRequest("GET", "/api/metrics/query_range?query=up", nil)
	rr = httptest.NewRecorder()
	handler.handleQueryRange(rr, req)
	assert.Equal(t, http.StatusBadRequest, rr.Code)

	// Missing end
	req = httptest.NewRequest("GET", "/api/metrics/query_range?query=up&start=2023-01-01T12:00:00Z", nil)
	rr = httptest.NewRecorder()
	handler.handleQueryRange(rr, req)
	assert.Equal(t, http.StatusBadRequest, rr.Code)
}

func TestHandleQueryRangeWithValidParameters(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "handler_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	handler := NewMetricsHandler(manager, logger)

	req := httptest.NewRequest("GET", "/api/metrics/query_range?query=up&start=2023-01-01T12:00:00Z&end=2023-01-01T13:00:00Z", nil)
	rr := httptest.NewRecorder()

	handler.handleQueryRange(rr, req)

	// Should get a proper response structure even if the query fails
	assert.True(t, rr.Code == http.StatusOK || rr.Code == http.StatusInternalServerError)

	var response map[string]interface{}
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, []string{"success", "error"}, response["status"])
}

func TestLiveMetricsResponse(t *testing.T) {
	timestamp := time.Now()
	response := LiveMetricsResponse{
		Data:      "# Test metrics\ntest_metric 1.0\n",
		Timestamp: timestamp,
		Source:    "test-cluster",
	}

	assert.Equal(t, "# Test metrics\ntest_metric 1.0\n", response.Data)
	assert.Equal(t, timestamp, response.Timestamp)
	assert.Equal(t, "test-cluster", response.Source)

	// Test JSON serialization
	data, err := json.Marshal(response)
	assert.NoError(t, err)
	assert.Contains(t, string(data), `"data":"# Test metrics\ntest_metric 1.0\n"`)
	assert.Contains(t, string(data), `"source":"test-cluster"`)
}

func TestQueryResponse(t *testing.T) {
	queryResult := &QueryResult{
		Type:  parser.ValueTypeVector,
		Value: nil, // Would contain actual Prometheus values in real usage
	}

	response := QueryResponse{
		Status: "success",
		Data:   *queryResult,
	}

	assert.Equal(t, "success", response.Status)
	assert.Equal(t, *queryResult, response.Data)

	// Test JSON serialization
	data, err := json.Marshal(response)
	assert.NoError(t, err)
	assert.Contains(t, string(data), `"status":"success"`)
}

func TestErrorResponse(t *testing.T) {
	response := ErrorResponse{
		Status: "error",
		Error:  "Test error message",
	}

	assert.Equal(t, "error", response.Status)
	assert.Equal(t, "Test error message", response.Error)

	// Test JSON serialization
	data, err := json.Marshal(response)
	assert.NoError(t, err)
	assert.Contains(t, string(data), `"status":"error"`)
	assert.Contains(t, string(data), `"error":"Test error message"`)
}

func TestRenderJSONAndRenderError(t *testing.T) {
	// Test renderJSON
	rr := httptest.NewRecorder()
	data := map[string]string{"test": "value"}

	renderJSON(rr, data)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))

	var response map[string]string
	err := json.Unmarshal(rr.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "value", response["test"])

	// Test renderError
	rr = httptest.NewRecorder()
	renderError(rr, http.StatusBadRequest, "Test error")

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))

	var errorResponse ErrorResponse
	err = json.Unmarshal(rr.Body.Bytes(), &errorResponse)
	assert.NoError(t, err)
	assert.Equal(t, "error", errorResponse.Status)
	assert.Equal(t, "Test error", errorResponse.Error)
}

func TestQueryResponseTypes(t *testing.T) {
	// Test different query result types
	vectorResult := &QueryResult{
		Type:  parser.ValueTypeVector,
		Value: nil,
	}

	matrixResult := &QueryResult{
		Type:  parser.ValueTypeMatrix,
		Value: nil,
	}

	scalarResult := &QueryResult{
		Type:  parser.ValueTypeScalar,
		Value: nil,
	}

	assert.Equal(t, parser.ValueTypeVector, vectorResult.Type)
	assert.Equal(t, parser.ValueTypeMatrix, matrixResult.Type)
	assert.Equal(t, parser.ValueTypeScalar, scalarResult.Type)
}

func TestHandlerIntegrationWithRouter(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "handler_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	handler := NewMetricsHandler(manager, logger)

	// Create a full router
	router := chi.NewRouter()
	handler.RegisterRoutes(router)

	// Test server
	server := httptest.NewServer(router)
	defer server.Close()

	// Make actual HTTP requests
	resp, err := http.Get(server.URL + "/api/metrics/query?query=up")
	assert.NoError(t, err)
	resp.Body.Close()

	// Should not be 404
	assert.NotEqual(t, http.StatusNotFound, resp.StatusCode)
}
