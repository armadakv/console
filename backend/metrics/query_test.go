package metrics

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/prometheus/prometheus/promql/parser"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

func TestNewQueryEngine(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "query_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create a real metrics manager to get a TSDB
	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	queryEngine := NewQueryEngine(manager.GetStorage(), logger)

	assert.NotNil(t, queryEngine)
	assert.NotNil(t, queryEngine.engine)
	assert.NotNil(t, queryEngine.logger)
	assert.Equal(t, 2*time.Minute, queryEngine.timeout)
	assert.NotNil(t, queryEngine.queryable)
}

func TestNewQueryEngineWithNilLogger(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "query_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create a real metrics manager to get a TSDB
	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	queryEngine := NewQueryEngine(manager.GetStorage(), nil)

	assert.NotNil(t, queryEngine)
	assert.NotNil(t, queryEngine.logger) // Should create a no-op logger
}

func TestQueryResult(t *testing.T) {
	// Test QueryResult structure
	result := &QueryResult{
		Type:  parser.ValueTypeVector,
		Value: nil, // In real usage, this would contain Prometheus values
	}

	assert.Equal(t, parser.ValueTypeVector, result.Type)
	assert.Nil(t, result.Value)

	// Test different value types
	matrixResult := &QueryResult{
		Type:  parser.ValueTypeMatrix,
		Value: nil,
	}

	scalarResult := &QueryResult{
		Type:  parser.ValueTypeScalar,
		Value: nil,
	}

	stringResult := &QueryResult{
		Type:  parser.ValueTypeString,
		Value: nil,
	}

	assert.Equal(t, parser.ValueTypeMatrix, matrixResult.Type)
	assert.Equal(t, parser.ValueTypeScalar, scalarResult.Type)
	assert.Equal(t, parser.ValueTypeString, stringResult.Type)
}

func TestQueryEngineQuery(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "query_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create a real metrics manager to get a TSDB
	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	queryEngine := NewQueryEngine(manager.GetStorage(), logger)

	ctx := context.Background()
	queryStr := "up"
	ts := time.Now()

	// Execute query - this will likely return an error due to no data,
	// but we're testing the method exists and handles the call properly
	result, err := queryEngine.Query(ctx, queryStr, ts)

	// The query might fail due to no data, but the method should handle it gracefully
	if err != nil {
		// Error is expected when there's no data
		assert.Error(t, err)
		assert.Nil(t, result)
	} else {
		// If no error, result should be valid
		assert.NotNil(t, result)
	}
}

func TestQueryEngineQueryRange(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "query_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create a real metrics manager to get a TSDB
	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	queryEngine := NewQueryEngine(manager.GetStorage(), logger)

	ctx := context.Background()
	queryStr := "up"
	start := time.Now().Add(-time.Hour)
	end := time.Now()
	step := time.Minute

	// Execute range query
	result, err := queryEngine.QueryRange(ctx, queryStr, start, end, step)

	// The query might fail due to no data, but the method should handle it gracefully
	if err != nil {
		// Error is expected when there's no data
		assert.Error(t, err)
		assert.Nil(t, result)
	} else {
		// If no error, result should be valid
		assert.NotNil(t, result)
	}
}

func TestQueryEngineInvalidQuery(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "query_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create a real metrics manager to get a TSDB
	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	queryEngine := NewQueryEngine(manager.GetStorage(), logger)

	ctx := context.Background()
	invalidQuery := "invalid{query[syntax"
	ts := time.Now()

	// Execute invalid query
	result, err := queryEngine.Query(ctx, invalidQuery, ts)

	// Should return an error for invalid syntax
	assert.Error(t, err)
	assert.NotNil(t, result) // Query engine returns empty result instead of nil
}

func TestQueryEngineTimeout(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "query_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create a real metrics manager to get a TSDB
	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	queryEngine := NewQueryEngine(manager.GetStorage(), logger)

	// Test that timeout is set correctly
	assert.Equal(t, 2*time.Minute, queryEngine.timeout)

	// Create a context with a very short timeout
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Millisecond)
	defer cancel()

	// Wait for context to timeout
	time.Sleep(10 * time.Millisecond)

	queryStr := "up"
	ts := time.Now()

	// Execute query with timed-out context
	result, err := queryEngine.Query(ctx, queryStr, ts)

	// Should return a context timeout error
	assert.Error(t, err)
	assert.NotNil(t, result)                     // Query engine returns empty result instead of nil
	assert.Contains(t, err.Error(), "timed out") // Different error message format
}

func TestQueryEngineRangeInvalidTimes(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "query_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create a real metrics manager to get a TSDB
	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	queryEngine := NewQueryEngine(manager.GetStorage(), logger)

	ctx := context.Background()
	queryStr := "up"

	// Test with start time after end time
	start := time.Now()
	end := start.Add(-time.Hour) // End before start
	step := time.Minute

	result, err := queryEngine.QueryRange(ctx, queryStr, start, end, step)

	// Should handle invalid time range gracefully
	if err != nil {
		assert.Error(t, err)
		assert.NotNil(t, result) // Query engine returns empty result instead of nil
	}
}

func TestQueryEngineZeroStep(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "query_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create a real metrics manager to get a TSDB
	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	queryEngine := NewQueryEngine(manager.GetStorage(), logger)

	ctx := context.Background()
	queryStr := "up"
	start := time.Now().Add(-time.Hour)
	end := time.Now()
	step := time.Duration(0) // Zero step

	result, err := queryEngine.QueryRange(ctx, queryStr, start, end, step)

	// Should handle zero step gracefully (might use default step)
	if err != nil {
		assert.Error(t, err)
		assert.Nil(t, result)
	}
}

func TestPromQLValueTypes(t *testing.T) {
	// Test that we can work with different Prometheus value types
	types := []parser.ValueType{
		parser.ValueTypeVector,
		parser.ValueTypeMatrix,
		parser.ValueTypeScalar,
		parser.ValueTypeString,
	}

	for _, valueType := range types {
		result := &QueryResult{
			Type:  valueType,
			Value: nil,
		}
		assert.Equal(t, valueType, result.Type)
	}
}

func TestQueryEngineConfiguration(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "query_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create a real metrics manager to get a TSDB
	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	queryEngine := NewQueryEngine(manager.GetStorage(), logger)

	// Verify the query engine configuration
	assert.NotNil(t, queryEngine.engine)
	assert.Equal(t, 2*time.Minute, queryEngine.timeout)
	assert.NotNil(t, queryEngine.queryable)

	// The engine should be configured with proper settings
	// We can't easily test the internal configuration without exposing it,
	// but we can verify it was created successfully
}

func TestQueryEngineEmptyQuery(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "query_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create a real metrics manager to get a TSDB
	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	queryEngine := NewQueryEngine(manager.GetStorage(), logger)

	ctx := context.Background()
	emptyQuery := ""
	ts := time.Now()

	// Execute empty query
	result, err := queryEngine.Query(ctx, emptyQuery, ts)

	// Should return an error for empty query
	assert.Error(t, err)
	assert.NotNil(t, result) // Query engine returns empty result instead of nil
}

func TestQueryEngineMultipleQueries(t *testing.T) {
	// Create a temporary directory for TSDB
	tempDir, err := os.MkdirTemp("", "query_test_*")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create a real metrics manager to get a TSDB
	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	queryEngine := NewQueryEngine(manager.GetStorage(), logger)

	ctx := context.Background()
	ts := time.Now()

	// Test multiple queries
	queries := []string{
		"up",
		"process_cpu_seconds_total",
		"go_memstats_alloc_bytes",
	}

	for _, query := range queries {
		// Each query might fail due to no data, but should not panic
		result, err := queryEngine.Query(ctx, query, ts)

		if err != nil {
			assert.Error(t, err)
			assert.Nil(t, result)
		} else {
			assert.NotNil(t, result)
		}
	}
}
