package metrics

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/armadakv/console/backend/armada"
	regattapb "github.com/armadakv/console/backend/armada/pb"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
	"google.golang.org/grpc"
)

// mockClusterPool implements ClusterPool for testing
type mockClusterPool struct {
	mock.Mock
}

func (m *mockClusterPool) GetConnection(ctx context.Context, address string) (*armada.ServerConnection, error) {
	args := m.Called(ctx, address)
	return args.Get(0).(*armada.ServerConnection), args.Error(1)
}

func (m *mockClusterPool) GetKnownAddresses() []string {
	args := m.Called()
	return args.Get(0).([]string)
}

// mockMetricsClient implements the gRPC metrics client for testing
type mockMetricsClient struct {
	mock.Mock
}

func (m *mockMetricsClient) GetMetrics(ctx context.Context, req *regattapb.MetricsRequest, opts ...grpc.CallOption) (*regattapb.MetricsResponse, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*regattapb.MetricsResponse), args.Error(1)
}

func createTempDir(t *testing.T) string {
	tempDir, err := os.MkdirTemp("", "metrics_test_*")
	assert.NoError(t, err)

	t.Cleanup(func() {
		os.RemoveAll(tempDir)
	})

	return tempDir
}

func TestNewMetricsManager(t *testing.T) {
	mockPool := &mockClusterPool{}
	tempDir := createTempDir(t)
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)

	assert.NoError(t, err)
	assert.NotNil(t, manager)
	assert.Equal(t, mockPool, manager.clusterPool)
	assert.Equal(t, time.Minute, manager.scrapeInterval)
	assert.NotNil(t, manager.logger)
	assert.NotNil(t, manager.storage)
	assert.NotNil(t, manager.done)
	assert.NotNil(t, manager.collectors)

	// Clean up
	manager.Stop()
}

func TestNewMetricsManagerWithNilLogger(t *testing.T) {
	mockPool := &mockClusterPool{}
	tempDir := createTempDir(t)

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, nil)

	assert.NoError(t, err)
	assert.NotNil(t, manager)
	assert.NotNil(t, manager.logger) // Should create a no-op logger

	// Clean up
	manager.Stop()
}

func TestNewMetricsManagerInvalidStorageDir(t *testing.T) {
	mockPool := &mockClusterPool{}
	logger := zap.NewNop()

	// Use an invalid path (a file instead of directory)
	tempFile, err := os.CreateTemp("", "invalid_dir")
	assert.NoError(t, err)
	tempFile.Close()
	defer os.Remove(tempFile.Name())

	manager, err := NewMetricsManager(mockPool, time.Minute, tempFile.Name(), logger)

	assert.Error(t, err)
	assert.Nil(t, manager)
	assert.Contains(t, err.Error(), "failed to open TSDB")
}

func TestMetricsManagerGetStorage(t *testing.T) {
	mockPool := &mockClusterPool{}
	tempDir := createTempDir(t)
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)

	storage := manager.GetStorage()
	assert.NotNil(t, storage)
	assert.Equal(t, manager.storage, storage)

	// Clean up
	manager.Stop()
}

func TestMetricsManagerStop(t *testing.T) {
	mockPool := &mockClusterPool{}
	tempDir := createTempDir(t)
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)

	// Stop should not panic and should close the storage
	manager.Stop()

	// Verify the done channel is closed
	select {
	case <-manager.done:
		// Expected - channel should be closed
	default:
		t.Error("Expected done channel to be closed")
	}
}

func TestMetricsManagerStartAndStop(t *testing.T) {
	mockPool := &mockClusterPool{}
	mockPool.On("GetKnownAddresses").Return([]string{})

	tempDir := createTempDir(t)
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, 100*time.Millisecond, tempDir, logger)
	assert.NoError(t, err)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start the manager
	manager.Start(ctx)

	// Let it run briefly
	time.Sleep(150 * time.Millisecond)

	// Stop the manager
	manager.Stop()

	// Verify mock expectations
	mockPool.AssertExpectations(t)
}

func TestMetricsCollector(t *testing.T) {
	mockPool := &mockClusterPool{}
	tempDir := createTempDir(t)
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	collector := &MetricsCollector{
		clusterAddr: "test-cluster:8080",
		manager:     manager,
		logger:      logger,
		pool:        mockPool,
	}

	assert.Equal(t, "test-cluster:8080", collector.clusterAddr)
	assert.Equal(t, manager, collector.manager)
	assert.Equal(t, logger, collector.logger)
	assert.Equal(t, mockPool, collector.pool)
}

func TestMetricsCollectorWithRealConnection(t *testing.T) {
	// Create a mock connection
	mockMetricsClient := &mockMetricsClient{}
	mockConnection := &armada.ServerConnection{
		MetricsClient: mockMetricsClient,
	}

	mockPool := &mockClusterPool{}
	mockPool.On("GetConnection", mock.Anything, "test-addr").Return(mockConnection, nil)

	// Mock successful metrics response
	mockResponse := &regattapb.MetricsResponse{
		MetricsData: "# Test metrics\ntest_metric 1.0\n",
		Timestamp:   time.Now().Unix(),
	}
	mockMetricsClient.On("GetMetrics", mock.Anything, mock.AnythingOfType("*regattapb.MetricsRequest")).Return(mockResponse, nil)

	tempDir := createTempDir(t)
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	collector := &MetricsCollector{
		clusterAddr: "test-addr",
		manager:     manager,
		logger:      logger,
		pool:        mockPool,
	}

	// Test that the collector can be created successfully
	assert.Equal(t, "test-addr", collector.clusterAddr)
	assert.Equal(t, manager, collector.manager)
	assert.Equal(t, logger, collector.logger)
	assert.Equal(t, mockPool, collector.pool)

	// Test actual metrics collection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collector.collect(ctx)

	// Verify the mocks were called
	mockPool.AssertExpectations(t)
	mockMetricsClient.AssertExpectations(t)
}

func TestMetricsCollectorConnectionError(t *testing.T) {
	mockPool := &mockClusterPool{}
	mockPool.On("GetConnection", mock.Anything, "invalid-addr").Return((*armada.ServerConnection)(nil), fmt.Errorf("connection failed"))

	tempDir := createTempDir(t)
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, time.Minute, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	collector := &MetricsCollector{
		clusterAddr: "invalid-addr",
		manager:     manager,
		logger:      logger,
		pool:        mockPool,
	}

	// Test that collector handles connection errors gracefully
	assert.Equal(t, "invalid-addr", collector.clusterAddr)

	// Test actual metrics collection with error
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collector.collect(ctx) // Should handle the error gracefully

	mockPool.AssertExpectations(t)
}

func TestMetricsManagerWithMultipleClusters(t *testing.T) {
	mockPool := &mockClusterPool{}
	addresses := []string{"cluster1:8080", "cluster2:8080"}
	mockPool.On("GetKnownAddresses").Return(addresses)

	// Create mock connections for each cluster
	for _, addr := range addresses {
		mockMetricsClient := &mockMetricsClient{}
		mockConnection := &armada.ServerConnection{
			MetricsClient: mockMetricsClient,
		}
		mockPool.On("GetConnection", mock.Anything, addr).Return(mockConnection, nil)

		// Mock metrics response
		mockResponse := &regattapb.MetricsResponse{
			MetricsData: fmt.Sprintf("# Metrics from %s\ntest_metric{cluster=\"%s\"} 1.0\n", addr, addr),
			Timestamp:   time.Now().Unix(),
		}
		mockMetricsClient.On("GetMetrics", mock.Anything, mock.AnythingOfType("*regattapb.MetricsRequest")).Return(mockResponse, nil)
	}

	tempDir := createTempDir(t)
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, 100*time.Millisecond, tempDir, logger)
	assert.NoError(t, err)
	defer manager.Stop()

	ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()

	manager.Start(ctx)

	// Let it run and collect metrics
	time.Sleep(200 * time.Millisecond)

	// Verify that collectors were created for each cluster
	assert.Len(t, manager.collectors, len(addresses))

	mockPool.AssertExpectations(t)
}

func TestClusterPoolInterface(t *testing.T) {
	// Verify that our mock implements the interface
	var _ ClusterPool = &mockClusterPool{}

	mockPool := &mockClusterPool{}
	mockPool.On("GetKnownAddresses").Return([]string{"test"})

	addresses := mockPool.GetKnownAddresses()
	assert.Equal(t, []string{"test"}, addresses)

	mockPool.AssertExpectations(t)
}

func TestMetricsDataStructure(t *testing.T) {
	// Test that we can work with metrics data
	data := "# TYPE test_metric counter\ntest_metric 42\n"
	timestamp := time.Now()
	source := "test-cluster"

	metricsData := armada.MetricsData{
		Data:      data,
		Timestamp: timestamp,
		Source:    source,
	}

	assert.Equal(t, data, metricsData.Data)
	assert.Equal(t, timestamp, metricsData.Timestamp)
	assert.Equal(t, source, metricsData.Source)
}

func TestMetricsManagerConcurrency(t *testing.T) {
	mockPool := &mockClusterPool{}
	mockPool.On("GetKnownAddresses").Return([]string{})

	tempDir := createTempDir(t)
	logger := zap.NewNop()

	manager, err := NewMetricsManager(mockPool, 50*time.Millisecond, tempDir, logger)
	assert.NoError(t, err)

	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()

	// Start multiple goroutines
	for i := 0; i < 3; i++ {
		go manager.Start(ctx)
	}

	// Let them run
	time.Sleep(100 * time.Millisecond)

	// Stop should be safe to call multiple times
	manager.Stop()
	manager.Stop() // Second call should not panic

	mockPool.AssertExpectations(t)
}
