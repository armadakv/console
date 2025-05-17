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
DOCKER=docker
DOCKER_IMAGE=armadakv/console
DOCKER_TAG=latest
GOLANGCI_LINT=golangci-lint

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
fmt: frontend-format
	$(GOFMT) ./...
	cd frontend && $(NPM) format

# Lint Go code with golangci-lint
.PHONY: lint
lint:
	$(GOLANGCI_LINT) run ./...
	cd frontend && $(NPM) lint

# Update dependencies
.PHONY: deps
deps:
	$(GOMOD) tidy

# Build for production
.PHONY: prod
prod: frontend-build
	$(GOBUILD) -o $(BINARY_NAME) -v -ldflags="-s -w"

# Build Docker image
.PHONY: docker-build
docker-build:
	$(DOCKER) build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .

# Run Docker image
.PHONY: docker-run
docker-run:
	$(DOCKER) run -p 8080:8080 $(DOCKER_IMAGE):$(DOCKER_TAG)

# Help
.PHONY: help
help:
	@echo "make build - Build the project (including frontend)"
	@echo "make clean - Clean the project (including frontend)"
	@echo "make run - Run the project"
	@echo "make dev - Run in development mode with hot reloading"
	@echo "make test - Test the project"
	@echo "make fmt - Format the code (backend and frontend)"
	@echo "make lint - Lint Go code with golangci-lint"
	@echo "make deps - Update dependencies"
	@echo "make prod - Build for production"
	@echo "make frontend-deps - Install frontend dependencies"
	@echo "make frontend-build - Build the frontend"
	@echo "make proto - Generate gRPC client code"
	@echo "make docker-build - Build Docker image"
	@echo "make docker-run - Run Docker image locally"
	@echo "make help - Show this help"

# Default target
.DEFAULT_GOAL := build
