package metrics

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// MetricsHandler handles HTTP requests for metrics data
type MetricsHandler struct {
	logger         *zap.Logger
	metricsManager *MetricsManager
	queryEngine    *QueryEngine
}

// NewMetricsHandler creates a new metrics handler
func NewMetricsHandler(metricsManager *MetricsManager, logger *zap.Logger) *MetricsHandler {
	if logger == nil {
		logger = zap.NewNop()
	}

	// Create a query engine for the TSDB
	queryEngine := NewQueryEngine(metricsManager.GetStorage(), logger)

	return &MetricsHandler{
		logger:         logger.Named("metrics-handler"),
		metricsManager: metricsManager,
		queryEngine:    queryEngine,
	}
}

// RegisterRoutes registers the metrics handler routes to the given router
func (h *MetricsHandler) RegisterRoutes(r chi.Router) {
	metricsRouter := chi.NewRouter()
	metricsRouter.Get("/query", h.handleQuery)
	metricsRouter.Get("/query_range", h.handleQueryRange)
	r.Mount("/api/metrics", metricsRouter)
}

// LiveMetricsResponse is the response format for live metrics
type LiveMetricsResponse struct {
	Data      string    `json:"data"`      // Metrics data in the requested format
	Timestamp time.Time `json:"timestamp"` // Time when metrics were collected
	Source    string    `json:"source"`    // Source cluster/server of the metrics
}

// QueryResponse is the response format for metrics queries
type QueryResponse struct {
	Status string      `json:"status"` // Query status (success, error)
	Data   QueryResult `json:"data"`   // The query result data
}

// QueryStatsResponse contains statistics about a query execution
type QueryStatsResponse struct {
	ExecutionTime string `json:"executionTime"` // Total execution time
	SamplesLoaded int    `json:"samplesLoaded"` // Number of samples loaded
}

// QueryRangeParamsResponse provides info about the parameters used for a range query
type QueryRangeParamsResponse struct {
	Start time.Time     `json:"start"` // Start time
	End   time.Time     `json:"end"`   // End time
	Step  time.Duration `json:"step"`  // Step duration between samples
}

// ErrorResponse is the response format for errors
type ErrorResponse struct {
	Status string `json:"status"` // Always "error"
	Error  string `json:"error"`  // Error message
}

// handleQuery handles instant queries against stored metrics
// @Summary Query stored metrics
// @Description Execute a PromQL query against stored metrics at a specific time
// @Tags metrics
// @Produce json
// @Param query query string true "PromQL query to execute"
// @Param time query string false "Query evaluation timestamp (RFC3339 or unix timestamp)"
// @Success 200 {object} QueryResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/metrics/query [get]
func (h *MetricsHandler) handleQuery(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	queryStr := r.URL.Query().Get("query")
	if queryStr == "" {
		renderError(w, http.StatusBadRequest, "Missing required parameter 'query'")
		return
	}

	// Parse time parameter or use current time
	timeParam := r.URL.Query().Get("time")
	var ts time.Time
	if timeParam == "" {
		ts = time.Now()
	} else {
		var err error
		// Try parsing as RFC3339
		ts, err = time.Parse(time.RFC3339, timeParam)
		if err != nil {
			// Try parsing as Unix timestamp
			unix, err := strconv.ParseInt(timeParam, 10, 64)
			if err != nil {
				renderError(w, http.StatusBadRequest, "Invalid time format")
				return
			}
			ts = time.Unix(unix, 0)
		}
	}

	h.logger.Debug("Executing metrics query",
		zap.String("query", queryStr),
		zap.Time("time", ts))

	// Execute the query
	result, err := h.queryEngine.Query(ctx, queryStr, ts)
	if err != nil {
		h.logger.Error("Query execution failed",
			zap.String("query", queryStr),
			zap.Error(err))
		renderError(w, http.StatusInternalServerError, "Query execution failed")
		return
	}

	// Format the response
	resp := QueryResponse{
		Status: "success",
		Data:   result,
	}

	renderJSON(w, resp)
}

// handleQueryRange handles range queries against stored metrics
// @Summary Query stored metrics over a time range
// @Description Execute a PromQL query against stored metrics over a specified time range
// @Tags metrics
// @Produce json
// @Param query query string true "PromQL query to execute"
// @Param start query string true "Start timestamp (RFC3339 or unix timestamp)"
// @Param end query string true "End timestamp (RFC3339 or unix timestamp)"
// @Param step query string false "Query resolution step width in duration format (e.g. 15s, 1m, 1h) or seconds (default: 1m)"
// @Success 200 {object} QueryResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/metrics/query_range [get]
func (h *MetricsHandler) handleQueryRange(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	queryStr := r.URL.Query().Get("query")
	if queryStr == "" {
		renderError(w, http.StatusBadRequest, "Missing required parameter 'query'")
		return
	}

	// Parse start time
	startParam := r.URL.Query().Get("start")
	if startParam == "" {
		renderError(w, http.StatusBadRequest, "Missing required parameter 'start'")
		return
	}
	startTime, err := parseTime(startParam)
	if err != nil {
		renderError(w, http.StatusBadRequest, "Invalid start time format")
		return
	}

	// Parse end time
	endParam := r.URL.Query().Get("end")
	if endParam == "" {
		renderError(w, http.StatusBadRequest, "Missing required parameter 'end'")
		return
	}
	endTime, err := parseTime(endParam)
	if err != nil {
		renderError(w, http.StatusBadRequest, "Invalid end time format")
		return
	}

	// Parse step
	stepParam := r.URL.Query().Get("step")
	var step time.Duration
	if stepParam == "" {
		step = time.Minute // Default step
	} else {
		step, err = parseDuration(stepParam)
		if err != nil {
			renderError(w, http.StatusBadRequest, "Invalid step format")
			return
		}
	}

	h.logger.Debug("Executing range query",
		zap.String("query", queryStr),
		zap.Time("start", startTime),
		zap.Time("end", endTime),
		zap.Duration("step", step))

	// Execute the query
	result, err := h.queryEngine.QueryRange(ctx, queryStr, startTime, endTime, step)
	if err != nil {
		h.logger.Error("Range query execution failed",
			zap.String("query", queryStr),
			zap.Error(err))
		renderError(w, http.StatusInternalServerError, "Range query execution failed")
		return
	}

	// Format the response
	resp := QueryResponse{
		Status: "success",
		Data:   result,
	}

	renderJSON(w, resp)
}

// Helper functions

// parseTime parses a time string in RFC3339 or Unix timestamp format
func parseTime(timeStr string) (time.Time, error) {
	// Try parsing as RFC3339
	t, err := time.Parse(time.RFC3339, timeStr)
	if err == nil {
		return t, nil
	}

	// Try parsing as Unix timestamp
	unix, err := strconv.ParseInt(timeStr, 10, 64)
	if err != nil {
		return time.Time{}, err
	}
	return time.Unix(unix, 0), nil
}

// parseDuration parses a duration string in Go duration format or seconds
func parseDuration(durationStr string) (time.Duration, error) {
	// Try parsing as Go duration
	d, err := time.ParseDuration(durationStr)
	if err == nil {
		return d, nil
	}

	// Try parsing as seconds
	seconds, err := strconv.ParseFloat(durationStr, 64)
	if err != nil {
		return 0, err
	}
	return time.Duration(seconds * float64(time.Second)), nil
}

// renderJSON renders an object as JSON response
func renderJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// renderError renders an error response
func renderError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{
		Status: "error",
		Error:  message,
	})
}
