# Multi-stage build for ArmadaKV Console
FROM golang:1.26-alpine AS builder
WORKDIR /app

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

# Build the binary
RUN make build

# Final image
FROM alpine:3.23
WORKDIR /app

# Add CA certificates for HTTPS
RUN apk add --no-cache ca-certificates tzdata

# Copy binary from backend-builder
COPY --from=builder /app/console /app/console

# Set environment variables
ENV PORT=8080
ENV ARMADA_URL=""

# Expose default port
EXPOSE 8080

# Command to run
ENTRYPOINT ["/app/console"]
