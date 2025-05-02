# Armada Dashboard

A UI console/dashboard for the [Armada](https://github.com/armadakv/armada) project.

## Overview

This dashboard provides a web-based interface for interacting with and monitoring the Armada project. It allows users to visualize data, manage resources, and perform operations without needing to use the command line.

## Features

- Web-based dashboard accessible from any browser
- Real-time monitoring of Armada resources
- User-friendly interface for common operations
- API endpoints for integration with other tools
- Key-value store management interface
- Cluster information and metrics visualization

## Getting Started

### Prerequisites

- Go 1.20 or later
- Node.js 16.x or later
- pnpm 8.x or later
- Access to the Armada project (expected to be in the same parent directory)

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

### Running the Dashboard

1. Start the dashboard server:
   ```
   ./console
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

## Project Structure

- `main.go` - Entry point for the application
- `frontend/` - React frontend application
  - `src/` - React source code
    - `components/` - React components
    - `styles/` - CSS styles
  - `dist/` - Compiled frontend assets (generated during build)
- `backend/` - Go packages for backend functionality
  - `api/` - API endpoints for the dashboard
  - `armada/` - gRPC client for interacting with the Armada server
    - `pb/` - Generated Protocol Buffers code
- `proto/` - Protocol Buffers definition files
- `hack/` - Scripts for code generation and other utilities

## Development

### Development Mode with Hot Reloading

The project supports a development mode where both frontend and backend are automatically reloaded when code changes are detected.

1. Start the development mode:
   ```
   make dev
   ```

   This will:
   - Start the frontend development server with hot reloading at http://localhost:3000
   - Start the backend with hot reloading using [Air](https://github.com/air-verse/air)
   - Proxy API requests from the frontend to the backend

2. Make changes to the frontend or backend code, and they will be automatically reloaded.

### Adding New Features

1. For backend changes, add new Go packages in the `pkg/` directory
2. For frontend changes, modify or add files in the `frontend/src/` directory:
   - Add new React components in `frontend/src/components/`
   - Add new styles in `frontend/src/styles/`

### Frontend Development

1. Install frontend dependencies:
   ```
   cd frontend
   pnpm install
   ```

2. Start the development server:
   ```
   pnpm start
   ```
   This will start a development server with hot reloading at http://localhost:3000

3. Build the frontend for production:
   ```
   pnpm run build
   ```
   This will create optimized production files in the `frontend/dist/` directory

### Building for Production

To build the entire application for production (both frontend and backend):

```
make prod
```

This will:
1. Install frontend dependencies
2. Build the frontend with production optimizations
3. Build the Go application with optimized flags

### Armada gRPC Client

The dashboard includes a gRPC client for communicating with the Armada server. The client is implemented in the `backend/armada` package and provides the following features:

- **Server Status**: Retrieve the current status of the Armada server
- **Cluster Information**: Get information about the Armada cluster, including node IDs, addresses, and Raft information
- **Metrics**: Retrieve performance metrics from the Armada server
- **Key-Value Operations**: Perform key-value operations such as get, put, and delete

#### Protocol Buffers

The client uses Protocol Buffers for communication with the Armada server. The Protocol Buffers definition files are located in the `proto/` directory, and the generated Go code is in the `backend/armada/pb/` directory.

To regenerate the Protocol Buffers code after making changes to the `.proto` files, run:

```
make proto
```

This will use the script in `hack/generate-proto.sh` to generate the Go code from the Protocol Buffers definition files.



#### Configuration

The dashboard can be configured to connect to a specific Armada server by setting the `ARMADA_URL` environment variable. By default, it connects to `http://localhost:8081`.

```
ARMADA_URL=http://armada-server:8081 ./console
```

## License

This project is licensed under the same license as the Armada project.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
