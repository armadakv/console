package main

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/armadakv/console/backend/api"
	"github.com/armadakv/console/backend/armada"
	"github.com/armadakv/console/backend/config"
	"github.com/armadakv/console/backend/metrics"
	"github.com/armadakv/console/frontend"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"go.uber.org/zap"
)

const staticDir = "dist"

// version is set at build time via -ldflags="-X main.version=<tag>".
var version = "dev"

type zapAdapter struct {
	logger *zap.Logger
}

func (z zapAdapter) Print(v ...interface{}) {
	z.logger.Info(fmt.Sprint(v...))
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize zap logger
	logger, err := zap.NewDevelopment()
	if err != nil {
		fmt.Printf("Failed to create logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync() // flushes buffer, if any

	cfg, err := config.Load()
	if err != nil {
		logger.Panic("Failed to load configuration", zap.Error(err))
	}
	logger.Info("Configuration loaded",
		zap.String("version", version),
		zap.String("armada.url", cfg.Armada.URL),
		zap.String("port", cfg.Port),
	)

	// Get the frontend filesystem
	frontendRoot, err := fs.Sub(frontend.FS, staticDir)
	if err != nil {
		logger.Panic("Failed to get frontend filesystem", zap.Error(err))
	}

	// Create a new Chi router
	r := chi.NewRouter()

	middleware.DefaultLogger = middleware.RequestLogger(&middleware.DefaultLogFormatter{
		Logger: &zapAdapter{logger: logger}, NoColor: true,
	},
	)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	pool, err := armada.NewConnectionPool(logger.Named("connections"), cfg.Armada)
	if err != nil {
		logger.Panic("Failed to create connection pool", zap.Error(err))
	}

	discovered, errs := pool.DiscoverAndConnect(ctx, cfg.Armada.URL)
	if len(errs) != 0 {
		logger.Panic("Failed to create Armada client", zap.Error(fmt.Errorf("discovery errors: %v", errs)))
	}
	if len(discovered) == 0 {
		logger.Panic("No Armada nodes discovered")
	}
	logger.Info("Discovered Armada nodes", zap.Int("count", len(discovered)))

	mm, err := metrics.NewMetricsManager(pool, cfg.Metrics.ScrapeInterval, cfg.Metrics.StoragePath, logger)
	if err != nil {
		logger.Panic("Failed to create metrics manager", zap.Error(err))
	}
	mm.Start(ctx)
	defer mm.Stop()

	client := armada.NewClient(discovered[rand.Intn(len(discovered))], pool, logger.Named("client"))
	apiHandler := api.NewHandler(client, logger.Named("api-handler"))
	apiHandler.RegisterRoutes(r)

	metricsHandler := metrics.NewMetricsHandler(mm, logger.Named("metrics-handler"))
	metricsHandler.RegisterRoutes(r)

	// Create a file server from the embedded filesystem
	fileServer := http.FileServer(http.FS(frontendRoot))

	// Serve frontend files and handle SPA routes
	r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		_, err := fs.Stat(frontendRoot, path[1:]) // Remove leading slash

		// If path doesn't exist, serve index.html for SPA client-side routing
		if os.IsNotExist(err) {
			r.URL.Path = "/"
		}

		fileServer.ServeHTTP(w, r)
	})

	// Setup server with graceful shutdown
	addr := ":" + cfg.Port
	server := &http.Server{
		Addr:              addr,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
	}

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		logger.Info("Starting Armada Dashboard server", zap.String("port", cfg.Port))
		logger.Info("Server ready", zap.String("url", "http://localhost"+addr))

		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Panic("Server error", zap.Error(err))
		}
	}()

	receivedSignal := <-sig
	logger.Info("Received shutdown signal", zap.String("signal", receivedSignal.String()))

	cancel() // stop background services (metrics, pool)

	logger.Info("Shutting down server gracefully")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exited successfully")
}
