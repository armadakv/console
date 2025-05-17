package metrics

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/armadakv/console/backend/armada"
	regattapb "github.com/armadakv/console/backend/armada/pb"

	"github.com/prometheus/prometheus/model/labels"
	"github.com/prometheus/prometheus/model/textparse"
	"github.com/prometheus/prometheus/tsdb"
	"go.uber.org/zap"
)

type ClusterPool interface {
	GetConnection(context.Context, string) (*armada.ServerConnection, error)
	GetKnownAddresses() []string
}

// MetricsManager manages metrics collection and storage for multiple Armada clusters
type MetricsManager struct {
	storage        *tsdb.DB
	clusterPool    ClusterPool
	scrapeInterval time.Duration
	logger         *zap.Logger
	done           chan struct{}
	collectors     map[string]*MetricsCollector
}

// MetricsCollector handles metrics collection for a single cluster
type MetricsCollector struct {
	clusterAddr string
	manager     *MetricsManager
	logger      *zap.Logger
	pool        ClusterPool
}

// NewMetricsManager creates a new metrics manager that periodically collects metrics
// from all discovered Armada clusters and stores them in a local TSDB
func NewMetricsManager(clusterPool ClusterPool, scrapeInterval time.Duration, storageDir string, logger *zap.Logger) (*MetricsManager, error) {
	if logger == nil {
		logger = zap.NewNop()
	}

	// Create TSDB storage
	opts := tsdb.DefaultOptions()
	opts.RetentionDuration = 24 * 60 * 60 * 1000 // 1 day in milliseconds
	opts.MinBlockDuration = 2 * 60 * 60 * 1000   // 2 hours in milliseconds

	db, err := tsdb.Open(storageDir, nil, nil, opts, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to open TSDB: %w", err)
	}

	manager := &MetricsManager{
		storage:        db,
		clusterPool:    clusterPool,
		scrapeInterval: scrapeInterval,
		logger:         logger.Named("metrics-manager"),
		done:           make(chan struct{}),
		collectors:     make(map[string]*MetricsCollector),
	}

	return manager, nil
}

// Start begins metrics collection from all clusters at the configured interval
func (m *MetricsManager) Start(ctx context.Context) {
	go m.runCollectionLoop(ctx)
}

// Stop stops the metrics collection process
func (m *MetricsManager) Stop() {
	close(m.done)
	if err := m.storage.Close(); err != nil {
		m.logger.Error("Error closing TSDB", zap.Error(err))
	}
}

// GetStorage returns the underlying TSDB storage
func (m *MetricsManager) GetStorage() *tsdb.DB {
	return m.storage
}

// runCollectionLoop periodically discovers clusters and collects metrics from them
func (m *MetricsManager) runCollectionLoop(ctx context.Context) {
	ticker := time.NewTicker(m.scrapeInterval)
	defer ticker.Stop()

	// Do an initial collection immediately
	m.collectFromAllClusters(ctx)

	for {
		select {
		case <-ticker.C:
			m.collectFromAllClusters(ctx)
		case <-m.done:
			return
		case <-ctx.Done():
			return
		}
	}
}

// collectFromAllClusters discovers all clusters and collects metrics from them
func (m *MetricsManager) collectFromAllClusters(ctx context.Context) {
	clusters, err := m.discoverClusters(ctx)
	if err != nil {
		m.logger.Error("Failed to discover clusters", zap.Error(err))
		return
	}

	// Add new clusters
	for _, addr := range clusters {
		if _, exists := m.collectors[addr]; !exists {
			m.addCluster(ctx, addr)
		}
	}

	// Remove clusters that no longer exist
	for addr := range m.collectors {
		found := false
		for _, discoveredAddr := range clusters {
			if addr == discoveredAddr {
				found = true
				break
			}
		}
		if !found {
			m.removeCluster(addr)
		}
	}

	// Collect metrics from all clusters
	for _, collector := range m.collectors {
		go collector.collect(ctx)
	}
}

// discoverClusters returns a list of all Armada cluster addresses
func (m *MetricsManager) discoverClusters(ctx context.Context) ([]string, error) {
	// This needs to be implemented based on how clusters are discovered in the console
	// For now, we'll just use the known clusters from the connection pool
	return m.clusterPool.GetKnownAddresses(), nil
}

// addCluster creates a new metrics collector for a cluster
func (m *MetricsManager) addCluster(ctx context.Context, addr string) {
	m.logger.Info("Adding metrics collector for cluster", zap.String("address", addr))

	collector := &MetricsCollector{
		clusterAddr: addr,
		pool:        m.clusterPool,
		manager:     m,
		logger:      m.logger.Named("collector").With(zap.String("cluster", addr)),
	}

	m.collectors[addr] = collector
}

// removeCluster removes a metrics collector for a cluster
func (m *MetricsManager) removeCluster(addr string) {
	m.logger.Info("Removing metrics collector for cluster", zap.String("address", addr))
	delete(m.collectors, addr)
}

// collect gathers metrics from a single Armada cluster and stores them in TSDB
func (c *MetricsCollector) collect(ctx context.Context) {
	c.logger.Debug("Collecting metrics")

	// Set a timeout for metrics collection
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	conn, err := c.pool.GetConnection(ctx, c.clusterAddr)
	if err != nil {
		c.logger.Error("Failed to get connection to cluster", zap.String("address", c.clusterAddr), zap.Error(err))
		return
	}
	// Get metrics from the cluster
	resp, err := conn.MetricsClient.GetMetrics(ctx, &regattapb.MetricsRequest{})
	if err != nil {
		c.logger.Error("Failed to collect metrics", zap.String("address", c.clusterAddr), zap.Error(err))
		return
	}

	md := &armada.MetricsData{
		Source:    c.clusterAddr,
		Data:      resp.MetricsData,
		Timestamp: time.Unix(resp.Timestamp, 0),
	}

	// Parse and store metrics in TSDB
	if err := c.storeMetricsInTSDB(ctx, md); err != nil {
		c.logger.Error("Failed to store metrics in TSDB", zap.Error(err))
	}
}

// storeMetricsInTSDB parses the Prometheus text format metrics and stores them in TSDB
func (c *MetricsCollector) storeMetricsInTSDB(ctx context.Context, metrics *armada.MetricsData) error {
	// Create an appender to add samples to the TSDB
	appender := c.manager.storage.Appender(ctx)

	// Parse metrics using Prometheus text parser
	parser := textparse.NewPromParser([]byte(metrics.Data), labels.NewSymbolTable())

	var (
		err  error
		lbls labels.Labels
	)

	// Get connection to retrieve node information
	conn, err := c.pool.GetConnection(ctx, c.clusterAddr)
	if err != nil {
		c.logger.Warn("Failed to get connection for node metadata, continuing with basic labels",
			zap.String("address", c.clusterAddr),
			zap.Error(err))
	}

	// Add cluster as a label to all metrics
	extraLabels := []labels.Label{
		{Name: "cluster", Value: c.clusterAddr},
	}

	// Add node ID and name as labels if available
	if conn != nil && conn.NodeID != "" {
		extraLabels = append(extraLabels, labels.Label{Name: "node_id", Value: conn.NodeID})
	}
	if conn != nil && conn.NodeName != "" {
		extraLabels = append(extraLabels, labels.Label{Name: "node_name", Value: conn.NodeName})
	}

	// Track metrics parsed
	metricCount := 0
	timestamp := metrics.Timestamp.UnixMilli()

	// Process all metrics
	for {
		et, err := parser.Next()
		if err != nil {
			if err == io.EOF {
				break
			}
			return fmt.Errorf("error parsing metrics: %w", err)
		}

		switch et {
		case textparse.EntrySeries:
			// Get series information
			_, _, val := parser.Series()
			parser.Labels(&lbls)

			// Add our extra labels
			lblsBuilder := labels.NewBuilder(lbls)
			for _, lbl := range extraLabels {
				lblsBuilder.Set(lbl.Name, lbl.Value)
			}
			lbls = lblsBuilder.Labels()

			// Add sample to TSDB
			_, err = appender.Append(0, lbls, timestamp, val)
			if err != nil {
				c.logger.Warn("Failed to append metric",
					zap.String("metric", lbls.Get("__name__")),
					zap.Error(err))
				continue
			}

			metricCount++

		case textparse.EntryHelp, textparse.EntryType, textparse.EntryComment, textparse.EntryUnit:
			// Skip metadata entries
			continue
		}
	}

	// Add a metric counting how many metrics we processed
	countLblsBuilder := labels.NewBuilder(labels.FromStrings(
		"__name__", "armada_metrics_sample_count",
		"cluster", c.clusterAddr,
	))

	for _, lbl := range extraLabels {
		countLblsBuilder.Set(lbl.Name, lbl.Value)
	}

	countLbls := countLblsBuilder.Labels()

	_, err = appender.Append(0, countLbls, timestamp, float64(metricCount))
	if err != nil {
		c.logger.Warn("Failed to append sample count metric", zap.Error(err))
	}

	// Commit samples to TSDB
	if err := appender.Commit(); err != nil {
		return fmt.Errorf("failed to commit metrics: %w", err)
	}

	c.logger.Debug("Successfully stored metrics in TSDB",
		zap.Int("samples", metricCount),
		zap.String("cluster", c.clusterAddr),
		zap.String("nodeID", conn.NodeID),
		zap.String("nodeName", conn.NodeName))

	return nil
}
