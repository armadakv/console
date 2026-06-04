# Contributing to ArmadaKV Console

Thank you for your interest in contributing to ArmadaKV Console!

## Technology Stack

### Backend
- **Language**: Go 1.24+
- **Web Framework**: [Chi](https://github.com/go-chi/chi) router
- **Logging**: [Zap](https://github.com/uber-go/zap) (structured logging)
- **Config**: [koanf v2](https://github.com/knadh/koanf)
- **Communication**: gRPC client for ArmadaKV interaction

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Package Manager**: pnpm 10.x
- **Styling**: Tailwind CSS
- **State / data-fetching**: React Query + React Router

## Project Structure

```
console/
├── main.go                  # Entry point; wires config, pool, and HTTP server
├── backend/
│   ├── api/                 # REST API handlers
│   ├── armada/              # gRPC connection pool and client wrappers
│   │   └── pb/              # Generated Protocol Buffers code
│   ├── config/              # koanf-based config loading
│   └── metrics/             # Embedded TSDB and scraping
├── frontend/
│   └── src/
│       ├── components/      # Reusable React components
│       ├── routes/          # Page-level components
│       ├── hooks/           # Custom React hooks
│       ├── api/             # Backend API client
│       └── types/           # TypeScript type definitions
├── proto/                   # Protocol Buffer definitions
├── hack/                    # Dev scripts (proto generation, etc.)
└── Dockerfile               # Multi-stage production build
```

## Development Setup

### Prerequisites

- Go 1.24+
- Node.js 22 (latest LTS)
- pnpm 10.x
- Docker (optional, for container testing)
- [golangci-lint](https://golangci-lint.run/welcome/install/) (for Go linting)
- [Air](https://github.com/air-verse/air) and [goreman](https://github.com/mattn/goreman) (installed automatically by `make dev`)

### First-time setup

```bash
git clone https://github.com/armadakv/console.git
cd console
go mod tidy
cd frontend && pnpm install && cd ..
```

### Development mode (recommended)

```bash
make dev
```

This uses goreman to run both processes from the `Procfile`:
- **Backend**: Air watches Go files and rebuilds on change
- **Frontend**: Vite dev server with HMR at http://localhost:3000 — API calls are proxied to the backend

### Backend only

```bash
go run .
```

### Frontend only

```bash
cd frontend
pnpm run dev
```

## Build Commands

| Command | Description |
|---|---|
| `make build` | Build frontend + backend binary |
| `make run` | Build and run |
| `make dev` | Hot-reload dev mode (Air + Vite) |
| `make prod` | Production build (minified frontend, stripped binary) |
| `make test` | Run all tests (backend + frontend) |
| `make fmt` | Format all code |
| `make lint` | Lint all code |
| `make deps` | Tidy Go modules |
| `make proto` | Re-generate Protocol Buffer code |
| `make docker-build` | Build Docker image |
| `make docker-run` | Run Docker image locally |
| `make clean` | Remove all build artifacts |

## Code Quality

### Backend

```bash
# Format (uses gofumpt via golangci-lint)
make fmt

# Lint
make lint

# Test
go test ./backend/...
```

The linting configuration is in `.golangci.yml`. Notable linters: `bodyclose`, `govet`, `staticcheck`, `gosec`, `godot`.

### Frontend

```bash
cd frontend

# Type-check
pnpm type-check

# Lint
pnpm lint
pnpm lint:fix  # auto-fix

# Format
pnpm format
```

### Protocol Buffers

If you change `.proto` files, regenerate the Go client code:

```bash
make proto
```

This runs `hack/generate-proto.sh`, which requires `protoc` and the gRPC Go plugins to be installed.

## Workflow

### Branching

- `main` — main development branch
- `feature/*` — new features
- `fix/*` — bug fixes
- `release/*` — release preparation

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add unix socket support
fix: handle missing TLS key gracefully
docs: document configuration options
chore: update go dependencies
refactor: extract TLS credential builder
```

### Pull requests

1. Create a branch from `main`
2. Make your changes and ensure `make lint` and `make test` pass
3. Open a PR and fill in the template
4. Request a review from a maintainer; address any feedback

## License

By contributing to this project you agree that your contributions will be licensed under the project's MIT License.