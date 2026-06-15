# Multi-stage build for ArmadaKV Console
FROM golang:1.26-alpine AS builder
WORKDIR /app

ARG VERSION=dev

# Install build dependencies
RUN apk add --no-cache protoc protobuf-dev make bash nodejs npm

# Install pnpm
RUN npm install -g pnpm

# Copy frontend package files
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/

# Install frontend dependencies
RUN cd frontend && pnpm install --frozen-lockfile --ignore-scripts

# Copy Go module files
COPY go.mod go.sum ./
RUN go mod download

COPY . ./

# Build frontend then the Go binary with the injected version
RUN cd frontend && pnpm build && cd .. && \
    go build -o console -v -ldflags="-s -w -X main.version=${VERSION}"

# Final image
FROM alpine:3.24
WORKDIR /app

# Add CA certificates for HTTPS
RUN apk add --no-cache ca-certificates tzdata

# Copy binary from builder
COPY --from=builder /app/console /app/console

# Expose default port
EXPOSE 8080

ENTRYPOINT ["/app/console"]
