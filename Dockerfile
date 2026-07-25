# syntax=docker/dockerfile:1.7
# Multi-stage build for ArmadaKV Console

# 1) Build frontend with a modern Node.js version.
FROM node:22-bookworm-slim AS frontend-builder
WORKDIR /app/frontend

# Install pnpm
RUN npm install -g pnpm

# Install frontend deps with cache-friendly layering.
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/.npmrc ./
RUN --mount=type=cache,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --ignore-scripts

# Build frontend assets.
COPY frontend/ ./
RUN pnpm build

# 2) Build Go backend binary on Debian-based Golang image.
FROM golang:1.26-bookworm AS go-builder
WORKDIR /app

ARG VERSION=dev

# Download Go modules first for better layer caching.
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# Copy full source, then inject built frontend assets.
COPY . ./
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Build Go binary with injected version metadata.
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -o console -v -ldflags="-s -w -X main.version=${VERSION}"

# 3) Final distroless runtime image.
FROM gcr.io/distroless/base-debian12:nonroot
WORKDIR /app

COPY --from=go-builder /app/console /app/console

EXPOSE 8080
ENTRYPOINT ["/app/console"]
