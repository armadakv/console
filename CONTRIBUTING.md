# Contributing to ArmadaKV Console

Thank you for your interest in contributing to ArmadaKV Console! This document provides guidelines and instructions for contributing to this project.

## Development Setup

### Prerequisites

- Go 1.24+
- Node.js (latest LTS)
- pnpm
- Docker (for container testing)
- golangci-lint (for Go code linting)

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/armadakv/console.git
   cd console
   ```

2. Install backend dependencies:
   ```bash
   go mod tidy
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   pnpm install
   cd ..
   ```

4. Start the development server:
   ```bash
   make dev
   ```

## Development Workflow

### Branching Model

- `main` - Main development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches
- `release/*` - Release preparation branches

### Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
3. Test your changes thoroughly
4. Commit your changes with a meaningful commit message
5. Push your branch and create a pull request

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `chore: update build scripts`
- `refactor: improve code structure`

## Pull Requests

When creating a pull request:

1. Fill in the PR template completely
2. Ensure CI passes for your branch
3. Request a review from a maintainer
4. Address any feedback or requested changes

## Code Style

### Go

- Follow the [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- Run `go fmt` to format your code
- Use `make lint` to run golangci-lint with project-specific configuration
- Ensure tests pass with `go test ./...`

The project uses golangci-lint with a configuration file (.golangci.yml) that enables specific linters:
- bodyclose - Checks for unclosed HTTP response bodies
- godot - Checks that comments end with a period
- gosec - Inspects source code for security problems
- staticcheck - Go static analysis tool
- And many more defined in the configuration

### TypeScript/React

- Follow the project's ESLint configuration
- Run `pnpm lint` and `pnpm typecheck` to validate code

## Testing

- Write tests for new features and bug fixes
- Ensure existing tests pass
- Test your changes across different browsers and screen sizes

## Documentation

- Update documentation when adding or changing features
- Document public APIs and components
- Include comments for complex code sections

## License

By contributing to this project, you agree that your contributions will be licensed under the project's license.

Thank you for contributing to ArmadaKV Console!