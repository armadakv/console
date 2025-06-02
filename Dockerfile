# Multi-stage build for ArmadaKV Console
FROM golang:1.24-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache protoc protobuf-dev make bash nodejs npm

# Install pnpm
RUN npm install -g pnpm

# Copy frontend package files
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy Go module files
COPY go.mod go.sum ./
RUN go mod download

COPY . ./

# Build the binary
RUN make build

# Final image
FROM alpine:3.22
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