# Armada Dashboard Makefile

# Variables
BINARY_NAME=console
GO=go
GOBUILD=$(GO) build
GOCLEAN=$(GO) clean
GOTEST=$(GO) test
GOGET=$(GO) get
GOMOD=$(GO) mod
GOFMT=$(GO) fmt
NPM=pnpm

# Install frontend dependencies
.PHONY: frontend-deps
frontend-deps:
	cd frontend && $(NPM) install

# Build frontend
.PHONY: frontend-build
frontend-build: frontend-deps
	cd frontend && $(NPM) run build

# Generate gRPC client code
.PHONY: proto
proto:
	./hack/generate-proto.sh

# Build the project
.PHONY: build
build: frontend-build proto
	$(GOBUILD) -o $(BINARY_NAME) -v

# Clean the project
.PHONY: clean
clean:
	$(GOCLEAN)
	rm -f $(BINARY_NAME)
	rm -rf frontend/dist frontend/node_modules proto backend/armada/pb

# Run the project
.PHONY: run
run: build
	./$(BINARY_NAME)

# Run in development mode with hot reloading
.PHONY: dev
dev:
	./hack/dev.sh

# Test the project
.PHONY: test
test:
	$(GOTEST) -v ./...

# Format the code
.PHONY: fmt
fmt:
	$(GOFMT) ./...

# Update dependencies
.PHONY: deps
deps:
	$(GOMOD) tidy

# Build for production
.PHONY: prod
prod: frontend-build
	$(GOBUILD) -o $(BINARY_NAME) -v -ldflags="-s -w"

# Help
.PHONY: help
help:
	@echo "make build - Build the project (including frontend)"
	@echo "make clean - Clean the project (including frontend)"
	@echo "make run - Run the project"
	@echo "make dev - Run in development mode with hot reloading"
	@echo "make test - Test the project"
	@echo "make fmt - Format the code"
	@echo "make deps - Update dependencies"
	@echo "make prod - Build for production"
	@echo "make frontend-deps - Install frontend dependencies"
	@echo "make frontend-build - Build the frontend"
	@echo "make proto - Generate gRPC client code"
	@echo "make help - Show this help"

# Default target
.DEFAULT_GOAL := build
