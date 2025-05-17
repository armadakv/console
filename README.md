# ArmadaKV Console

A web-based dashboard for managing and monitoring the [ArmadaKV](https://github.com/armadakv/armada) distributed key-value store.

## Overview

ArmadaKV Console provides an intuitive interface for interacting with and monitoring ArmadaKV clusters. It allows users to visualize data, manage key-value pairs, monitor cluster resources, and perform administrative operations through a modern web interface.

## Features

- **Data Management**: Browse, add, edit, and delete key-value pairs across tables
- **Cluster Monitoring**: Real-time monitoring of ArmadaKV nodes and resources
- **Table Administration**: Create, configure, and manage data tables
- **User-Friendly Interface**: Modern React-based UI with intuitive navigation
- **RESTful API**: Backend API endpoints for integration with other tools
- **Performance Metrics**: Visualization of system performance and usage statistics

## Technology Stack

### Backend
- **Language**: Go 1.24+
- **Web Framework**: Chi router
- **Logging**: Zap (structured logging)
- **Communication**: gRPC client for ArmadaKV interaction

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **UI Structure**: Component-based architecture with hooks

## Getting Started

### Prerequisites

- Go 1.20 or later
- Node.js 16.x or later
- pnpm 8.x or later
- Access to an ArmadaKV instance

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/armadakv/console.git
   ```

2. Navigate to the project directory:
   ```
   cd console
   ```

3. Install pnpm if you haven't already:
   ```
   npm install -g pnpm
   ```

4. Build the project (this will also build the frontend):
   ```
   make build
   ```

   Alternatively, you can use:
   ```
   make frontend-deps  # Install frontend dependencies
   make frontend-build # Build the frontend
   go build            # Build the Go application
   ```

### Running the Console

1. Start the console server:
   ```
   ./console
   ```

   Or use the Makefile command:
   ```
   make run
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

3. Configure connection to your ArmadaKV server by setting the `ARMADA_URL` environment variable:
   ```
   ARMADA_URL=http://your-armada-server:5001 ./console
   ```
   Default is `http://localhost:5001`.

### Using Docker

You can run ArmadaKV Console using Docker:

1. Build the Docker image:
   ```
   make docker-build
   ```

2. Run the Docker container:
   ```
   make docker-run
   ```
   
   Or with custom configuration:
   ```
   docker run -p 8080:8080 -e ARMADA_URL=http://your-armada-server:5001 armadakv/console:latest
   ```

3. Access the console at `http://localhost:8080`

## Project Structure

- `main.go` - Entry point for the application
- `frontend/` - React frontend application
  - `src/` - React source code
    - `components/` - Reusable UI components
    - `routes/` - Page-level components
    - `hooks/` - Custom React hooks
    - `api/` - API client for backend communication
    - `types/` - TypeScript type definitions
- `backend/` - Go packages for backend functionality
  - `api/` - REST API endpoints for the dashboard
  - `armada/` - gRPC client for interacting with the ArmadaKV server
    - `pb/` - Generated Protocol Buffers code
- `proto/` - Protocol Buffers definition files
- `hack/` - Helper scripts for development and code generation
- `Dockerfile` - Multi-stage Docker build configuration

## Development

### Development Mode with Hot Reloading

1. Start development mode:
   ```
   make dev
   ```

   This runs:
   - Frontend development server with hot reloading (http://localhost:3000)
   - Backend with hot reloading using Air
   - API requests from frontend to backend are automatically proxied

2. Make changes to the code, and they will be automatically reflected.

### Frontend Development

```
cd frontend
pnpm install
pnpm run dev
```

### Building for Production

```
make prod
```

This creates an optimized production build with:
- Minified frontend assets
- Compiled Go binary with optimized flags

### Available Make Commands

- `make build` - Build the project (frontend and backend)
- `make clean` - Clean all build artifacts
- `make run` - Build and run the application
- `make dev` - Run in development mode with hot reloading
- `make test` - Run all tests
- `make fmt` - Format code
- `make lint` - Lint Go code with golangci-lint
- `make deps` - Update dependencies
- `make proto` - Generate Protocol Buffer code
- `make docker-build` - Build Docker image
- `make docker-run` - Run Docker container locally
- `make help` - Display available commands

### Backend Linting and Formatting

The Go codebase uses golangci-lint for code quality and consistent formatting:

```bash
# Format Go code
make fmt

# Lint Go code
make lint
```

The linting configuration is defined in `.golangci.yml` and enables various linters including:
- bodyclose - Checks for unclosed HTTP response bodies
- govet - Reports suspicious code constructs
- staticcheck - Advanced Go static analysis
- and many more

### Frontend Linting and Formatting

The frontend codebase uses ESLint and Prettier for code quality and consistent formatting:

```bash
# Run linter
cd frontend
pnpm lint

# Fix linting issues automatically
pnpm lint:fix

# Format code with Prettier
pnpm format
```

This ensures code consistency across the project. The linting configuration follows modern React and TypeScript best practices with rules defined in the `eslint.config.js` file.

## API Endpoints

The console provides RESTful API endpoints for:

- Getting cluster information
- Managing key-value data
- Retrieving system metrics
- Table administration

API documentation is available at `/api/docs` when running the console.

## Environment Variables

- `PORT`: HTTP server port (default: 8080)
- `ARMADA_URL`: ArmadaKV server URL (default: http://localhost:5001)

## Contributing

Please refer to [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on contributing to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
