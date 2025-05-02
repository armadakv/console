#!/bin/bash

# Script to generate gRPC client code from proto files

set -e

# Create directories if they don't exist
mkdir -p proto
mkdir -p backend/armada/pb

# Install protoc-gen-go and protoc-gen-go-grpc if not already installed
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Generate Go code from proto files
protoc -I proto/ --go_out=backend/armada/pb --go_opt=paths=source_relative \
       --go-grpc_out=backend/armada/pb --go-grpc_opt=paths=source_relative \
       proto/*.proto

echo "gRPC client code generated successfully"