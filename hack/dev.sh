#!/bin/bash

# Exit on error
set -e

# Check if air is installed
if ! command -v air &> /dev/null; then
    echo "Installing air..."
    go install github.com/air-verse/air@latest
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "Error: pnpm is not installed. Please install it first."
    echo "You can install it with: npm install -g pnpm"
    exit 1
fi

# Start frontend and backend in parallel
echo "Starting development servers..."

# Start frontend in background
(cd frontend && pnpm install && pnpm start) &
FRONTEND_PID=$!

# Start backend with air
air

# Kill frontend process when backend is stopped
kill $FRONTEND_PID