# ArmadaKV Console

A web-based dashboard for managing and monitoring the [ArmadaKV](https://github.com/armadakv/armada) distributed key-value store.

## Features

- **Data Management**: Browse, add, edit, and delete key-value pairs across tables
- **Cluster Monitoring**: Real-time monitoring of ArmadaKV nodes and resources
- **Table Administration**: Create, configure, and manage data tables
- **Performance Metrics**: Visualization of system performance and usage statistics

## Quick Start

### Download a binary

Pre-built binaries for Linux and macOS (amd64 and arm64) are attached to every [release](https://github.com/armadakv/console/releases/latest).

```bash
# Example: Linux amd64
curl -L https://github.com/armadakv/console/releases/latest/download/console-linux-amd64.tar.gz | tar xz
./console
```

Open [http://localhost:8080](http://localhost:8080). By default the console connects to an ArmadaKV server at `http://localhost:5001`.

Point it at your server:

```bash
ARMADA_CONSOLE_ARMADA__URL=https://armada.example.com:5001 ./console
```

### Run with Docker

```bash
docker run -p 8080:8080 \
  -e ARMADA_CONSOLE_ARMADA__URL=https://armada.example.com:5001 \
  ghcr.io/armadakv/console:latest
```

#### Using a config file

Mount a `console.yaml` into the container:

```bash
docker run -p 8080:8080 \
  -v /path/to/console.yaml:/app/console.yaml \
  ghcr.io/armadakv/console:latest
```

Or place the file anywhere and point to it:

```bash
docker run -p 8080:8080 \
  -v /etc/armada/console.yaml:/etc/armada/console.yaml \
  -e ARMADA_CONSOLE_CONFIG=/etc/armada/console.yaml \
  ghcr.io/armadakv/console:latest
```

#### Mounting TLS certificates

```bash
docker run -p 8080:8080 \
  -v /etc/armada/certs:/certs:ro \
  -e ARMADA_CONSOLE_ARMADA__URL=https://armada.example.com:5001 \
  -e ARMADA_CONSOLE_ARMADA__TLS__CACERT=/certs/ca.pem \
  -e ARMADA_CONSOLE_ARMADA__TLS__CLIENTCERT=/certs/client.pem \
  -e ARMADA_CONSOLE_ARMADA__TLS__CLIENTKEY=/certs/client.key \
  ghcr.io/armadakv/console:latest
```

#### Available image tags

| Tag | When it is updated |
|---|---|
| `latest` | Not published automatically — use a versioned tag |
| `main` | Every push to the `main` branch |
| `main-<sha>` | Every push to `main`, tagged with the commit SHA |
| `vX.Y.Z` | Release tags |
| `vX.Y` | Kept in sync with the latest patch release |
| `vX` | Kept in sync with the latest minor release (not for v0.x) |

## Configuration

Configuration is loaded in order (later sources override earlier ones):

1. Built-in defaults
2. YAML config file (`console.yaml` in the working directory, or the path in `ARMADA_CONSOLE_CONFIG`)
3. Environment variables with the `ARMADA_CONSOLE_` prefix

### Config file

Place a `console.yaml` file next to the binary (or point `ARMADA_CONSOLE_CONFIG` to it):

```yaml
port: "8080"

armada:
  url: https://armada.example.com:5001
  token: ""          # bearer token (optional)
  tls:
    cacert: ""       # path to PEM CA certificate
    clientcert: ""   # path to PEM client certificate (mTLS)
    clientkey: ""    # path to PEM private key (mTLS)
    servername: ""   # override TLS SNI / certificate hostname
    insecure: false  # disable cert verification (dev only)

metrics:
  storagepath: /tmp/tsdb
  scrapeinterval: 30s
```

If `ARMADA_CONSOLE_CONFIG` is set, the file **must** exist; otherwise `console.yaml` is loaded if present and silently skipped if absent.

### Environment variables

All settings can also be set via environment variables. The prefix is `ARMADA_CONSOLE_` and path segments are separated by `__` (double underscore):

| Environment variable | Config key | Default |
|---|---|---|
| `ARMADA_CONSOLE_PORT` | `port` | `8080` |
| `ARMADA_CONSOLE_ARMADA__URL` | `armada.url` | `http://localhost:5001` |
| `ARMADA_CONSOLE_ARMADA__TOKEN` | `armada.token` | _(none)_ |
| `ARMADA_CONSOLE_ARMADA__TLS__CACERT` | `armada.tls.cacert` | _(none)_ |
| `ARMADA_CONSOLE_ARMADA__TLS__CLIENTCERT` | `armada.tls.clientcert` | _(none)_ |
| `ARMADA_CONSOLE_ARMADA__TLS__CLIENTKEY` | `armada.tls.clientkey` | _(none)_ |
| `ARMADA_CONSOLE_ARMADA__TLS__SERVERNAME` | `armada.tls.servername` | _(none)_ |
| `ARMADA_CONSOLE_ARMADA__TLS__INSECURE` | `armada.tls.insecure` | `false` |
| `ARMADA_CONSOLE_METRICS__STORAGEPATH` | `metrics.storagepath` | `/tmp/tsdb` |
| `ARMADA_CONSOLE_METRICS__SCRAPEINTERVAL` | `metrics.scrapeinterval` | `30s` |

### URL schemes

The `armada.url` scheme controls whether TLS is used and is the sole authority for that decision — there is no separate `tls.enabled` toggle.

| Scheme | Transport | TLS config allowed |
|---|---|---|
| `http://host:port` | Plaintext TCP | No — error at startup |
| `https://host:port` | TLS TCP | Yes |
| `unix:///path/to/socket` | Plaintext Unix socket | No — error at startup |
| `unixs:///path/to/socket` | TLS Unix socket | Yes |

The URL scheme is required. Omitting it or using an unsupported scheme is a startup error.

### TLS and mTLS

For a basic TLS connection (verify the server certificate using the system CA pool):

```yaml
armada:
  url: https://armada.example.com:5001
```

To use a custom CA certificate:

```yaml
armada:
  url: https://armada.example.com:5001
  tls:
    cacert: /etc/armada/ca.pem
```

For mutual TLS (mTLS) with client certificates:

```yaml
armada:
  url: https://armada.example.com:5001
  tls:
    cacert: /etc/armada/ca.pem
    clientcert: /etc/armada/client.pem
    clientkey: /etc/armada/client.key
```

Client certificates are re-read on every TLS handshake, so short-lived certificates (e.g. issued by Vault or cert-manager) are picked up automatically without restarting the console.

To override the server name used in SNI and certificate verification (useful when dialing by IP):

```yaml
armada:
  url: https://10.0.0.1:5001
  tls:
    servername: armada.internal
```

### Bearer token authentication

```yaml
armada:
  url: https://armada.example.com:5001
  token: eyJhbGci...
```

A warning is logged if a token is configured alongside a non-TLS URL, but it is not treated as an error (useful for local development).

## Building from source

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and build instructions.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

Configuration is loaded in order (later sources override earlier ones):

1. Built-in defaults
2. YAML config file (`console.yaml` in the working directory, or the path in `ARMADA_CONSOLE_CONFIG`)
3. Environment variables with the `ARMADA_CONSOLE_` prefix

### Config file

Place a `console.yaml` file next to the binary (or point `ARMADA_CONSOLE_CONFIG` to it):

```yaml
port: "8080"

armada:
  url: https://armada.example.com:5001
  token: ""          # bearer token (optional)
  tls:
    cacert: ""       # path to PEM CA certificate
    clientcert: ""   # path to PEM client certificate (mTLS)
    clientkey: ""    # path to PEM private key (mTLS)
    servername: ""   # override TLS SNI / certificate hostname
    insecure: false  # disable cert verification (dev only)

metrics:
  storagepath: /tmp/tsdb
  scrapeinterval: 30s
```

If `ARMADA_CONSOLE_CONFIG` is set, the file **must** exist; otherwise `console.yaml` is loaded if present and silently skipped if absent.

### Environment variables

All settings can also be set via environment variables. The prefix is `ARMADA_CONSOLE_` and path segments are separated by `__` (double underscore):

| Environment variable | Config key | Default |
|---|---|---|
| `ARMADA_CONSOLE_PORT` | `port` | `8080` |
| `ARMADA_CONSOLE_ARMADA__URL` | `armada.url` | `http://localhost:5001` |
| `ARMADA_CONSOLE_ARMADA__TOKEN` | `armada.token` | _(none)_ |
| `ARMADA_CONSOLE_ARMADA__TLS__CACERT` | `armada.tls.cacert` | _(none)_ |
| `ARMADA_CONSOLE_ARMADA__TLS__CLIENTCERT` | `armada.tls.clientcert` | _(none)_ |
| `ARMADA_CONSOLE_ARMADA__TLS__CLIENTKEY` | `armada.tls.clientkey` | _(none)_ |
| `ARMADA_CONSOLE_ARMADA__TLS__SERVERNAME` | `armada.tls.servername` | _(none)_ |
| `ARMADA_CONSOLE_ARMADA__TLS__INSECURE` | `armada.tls.insecure` | `false` |
| `ARMADA_CONSOLE_METRICS__STORAGEPATH` | `metrics.storagepath` | `/tmp/tsdb` |
| `ARMADA_CONSOLE_METRICS__SCRAPEINTERVAL` | `metrics.scrapeinterval` | `30s` |

### URL schemes

The `armada.url` scheme controls whether TLS is used and is the sole authority for that decision — there is no separate `tls.enabled` toggle.

| Scheme | Transport | TLS config allowed |
|---|---|---|
| `http://host:port` | Plaintext TCP | No — error at startup |
| `https://host:port` | TLS TCP | Yes |
| `unix:///path/to/socket` | Plaintext Unix socket | No — error at startup |
| `unixs:///path/to/socket` | TLS Unix socket | Yes |

The URL scheme is required. Omitting it or using an unsupported scheme is a startup error.

### TLS and mTLS

For a basic TLS connection (verify the server certificate using the system CA pool):

```yaml
armada:
  url: https://armada.example.com:5001
```

To use a custom CA certificate:

```yaml
armada:
  url: https://armada.example.com:5001
  tls:
    cacert: /etc/armada/ca.pem
```

For mutual TLS (mTLS) with client certificates:

```yaml
armada:
  url: https://armada.example.com:5001
  tls:
    cacert: /etc/armada/ca.pem
    clientcert: /etc/armada/client.pem
    clientkey: /etc/armada/client.key
```

Client certificates are re-read on every TLS handshake, so short-lived certificates (e.g. issued by Vault or cert-manager) are picked up automatically without restarting the console.

To override the server name used in SNI and certificate verification (useful when dialing by IP):

```yaml
armada:
  url: https://10.0.0.1:5001
  tls:
    servername: armada.internal
```

### Bearer token authentication

```yaml
armada:
  url: https://armada.example.com:5001
  token: eyJhbGci...
```

A warning is logged if a token is configured alongside a non-TLS URL, but it is not treated as an error (useful for local development).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, project structure, and contribution guidelines.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
