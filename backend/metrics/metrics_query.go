package metrics

import (
	"context"
	"fmt"
	"time"

	"github.com/prometheus/prometheus/promql/parser"

	"github.com/prometheus/prometheus/promql"
	"github.com/prometheus/prometheus/storage"
	"github.com/prometheus/prometheus/tsdb"
	"go.uber.org/zap"
)

// QueryEngine wraps the Prometheus query engine for TSDB queries
type QueryEngine struct {
	engine    *promql.Engine
	logger    *zap.Logger
	timeout   time.Duration
	queryable storage.Queryable
}

// NewQueryEngine creates a new query engine for metrics TSDB
func NewQueryEngine(db *tsdb.DB, logger *zap.Logger) *QueryEngine {
	if logger == nil {
		logger = zap.NewNop()
	}

	// Create a Prometheus query engine with settings calibrated for our use case
	engineOpts := promql.EngineOpts{
		Logger:        nil,
		Reg:           nil,
		MaxSamples:    50000000,
		Timeout:       2 * time.Minute,
		LookbackDelta: 5 * time.Minute,
	}
	engine := promql.NewEngine(engineOpts)

	return &QueryEngine{
		engine:    engine,
		logger:    logger.Named("query-engine"),
		timeout:   2 * time.Minute,
		queryable: db,
	}
}

// QueryResult contains the result of a metrics query
type QueryResult struct {
	Type  parser.ValueType `json:"resultType"`
	Value parser.Value     `json:"result"` // The query result value (Vector, Matrix, Scalar, or String)
	Stats QueryStats       `json:"stats"`  // Query execution stats
}

// QueryStats contains statistics about query execution
type QueryStats struct {
	ExecutionTime time.Duration // Total execution time
	SamplesLoaded int           // Number of samples loaded
}

// Query executes a PromQL query at the specified time
func (q *QueryEngine) Query(ctx context.Context, queryStr string, ts time.Time) (QueryResult, error) {
	// Create a context with timeout to prevent runaway queries
	ctx, cancel := context.WithTimeout(ctx, q.timeout)
	defer cancel()

	q.logger.Debug("Executing query",
		zap.String("query", queryStr),
		zap.Time("time", ts))

	// Parse the query
	query, err := q.engine.NewInstantQuery(ctx, q.queryable, nil, queryStr, ts)
	if err != nil {
		q.logger.Error("Error parsing query",
			zap.String("query", queryStr),
			zap.Error(err))
		return QueryResult{}, fmt.Errorf("error parsing query: %w", err)
	}
	defer query.Close()

	// Execute the query
	startTime := time.Now()
	res := query.Exec(ctx)
	executionTime := time.Since(startTime)

	// Check for errors
	if res.Err != nil {
		q.logger.Error("Query execution error",
			zap.String("query", queryStr),
			zap.Error(res.Err))
		return QueryResult{}, fmt.Errorf("query execution error: %w", res.Err)
	}

	// Create query result with stats
	result := QueryResult{
		Type:  res.Value.Type(),
		Value: res.Value,
		Stats: QueryStats{
			ExecutionTime: executionTime,
			// Approximation based on result size for now, proper tracking would require modification
			// of Prometheus engine internals
			SamplesLoaded: approximateSamplesFromResult(res.Value),
		},
	}

	q.logger.Debug("Query execution completed",
		zap.String("query", queryStr),
		zap.Duration("execution_time", executionTime))

	return result, nil
}

// QueryRange executes a PromQL query over a time range
func (q *QueryEngine) QueryRange(ctx context.Context, queryStr string, start, end time.Time, step time.Duration) (QueryResult, error) {
	// Create a context with timeout to prevent runaway queries
	ctx, cancel := context.WithTimeout(ctx, q.timeout)
	defer cancel()

	// Ensure step is valid
	if step <= 0 {
		step = time.Minute // Default step
		q.logger.Warn("Invalid step value, using default",
			zap.String("query", queryStr),
			zap.Duration("default_step", step))
	}

	// Validate time range
	if end.Before(start) {
		return QueryResult{}, fmt.Errorf("invalid time range: end time %s is before start time %s", end, start)
	}

	// Limit time range to prevent excessive queries
	maxDuration := 7 * 24 * time.Hour // 7 days
	if end.Sub(start) > maxDuration {
		q.logger.Warn("Time range too large, limiting to maximum duration",
			zap.Duration("requested_duration", end.Sub(start)),
			zap.Duration("maximum_duration", maxDuration))
		end = start.Add(maxDuration)
	}

	q.logger.Debug("Executing range query",
		zap.String("query", queryStr),
		zap.Time("start", start),
		zap.Time("end", end),
		zap.Duration("step", step))

	// Parse the query
	query, err := q.engine.NewRangeQuery(ctx, q.queryable, nil, queryStr, start, end, step)
	if err != nil {
		q.logger.Error("Error parsing range query",
			zap.String("query", queryStr),
			zap.Error(err))
		return QueryResult{}, fmt.Errorf("error parsing query: %w", err)
	}
	defer query.Close()

	// Execute the query
	startTime := time.Now()
	res := query.Exec(ctx)
	executionTime := time.Since(startTime)

	// Check for errors
	if res.Err != nil {
		q.logger.Error("Range query execution error",
			zap.String("query", queryStr),
			zap.Error(res.Err))
		return QueryResult{}, fmt.Errorf("query execution error: %w", res.Err)
	}

	// Create query result with stats
	result := QueryResult{
		Value: res.Value,
		Stats: QueryStats{
			ExecutionTime: executionTime,
			SamplesLoaded: approximateSamplesFromResult(res.Value),
		},
	}

	q.logger.Debug("Range query execution completed",
		zap.String("query", queryStr),
		zap.Duration("execution_time", executionTime),
		zap.Int("warnings", len(res.Warnings)))

	return result, nil
}

// approximateSamplesFromResult estimates the number of samples based on the result type
func approximateSamplesFromResult(value parser.Value) int {
	if value == nil {
		return 0
	}

	switch v := value.(type) {
	case promql.Vector:
		return len(v)
	case promql.Matrix:
		count := 0
		for _, series := range v {
			count += len(series.Floats) + len(series.Histograms)
		}
		return count
	case promql.Scalar, promql.String:
		return 1
	default:
		return 0
	}
}
