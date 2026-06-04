// Package config provides koanf-based configuration loading for the Armada Console.
// Configuration is loaded in order (each layer overrides the previous):
//  1. Built-in defaults
//  2. YAML config file — optional unless ARMADA_CONSOLE_CONFIG is explicitly set
//  3. Environment variables with the ARMADA_CONSOLE_ prefix
//
// Environment variable naming uses __ as the path delimiter, e.g.:
//
//	ARMADA_CONSOLE_ARMADA__URL=https://armada:5001
//	ARMADA_CONSOLE_ARMADA__TLS__CACERT=/etc/certs/ca.pem
//	ARMADA_CONSOLE_ARMADA__TLS__CLIENTCERT=/etc/certs/client.pem
//	ARMADA_CONSOLE_ARMADA__TLS__CLIENTKEY=/etc/certs/client.key
package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/knadh/koanf/parsers/yaml"
	"github.com/knadh/koanf/providers/confmap"
	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/providers/file"
	"github.com/knadh/koanf/v2"
)

const (
	envPrefix     = "ARMADA_CONSOLE_"
	envPathDelim  = "__"
	configFileEnv = "ARMADA_CONSOLE_CONFIG"
)

// Config holds the full application configuration.
type Config struct {
	Port    string        `koanf:"port"`
	Armada  ArmadaConfig  `koanf:"armada"`
	Metrics MetricsConfig `koanf:"metrics"`
}

// ArmadaConfig holds configuration for connecting to the Armada server.
type ArmadaConfig struct {
	// URL is the seed address of the Armada server (e.g. "https://armada:5001").
	// The scheme is required: use http:// for plaintext or https:// for TLS.
	URL string `koanf:"url"`
	// Token is a bearer token sent with every RPC. A warning is logged if used
	// without TLS, but it is not rejected (useful for local development).
	Token string `koanf:"token"`
	// TLS holds optional TLS settings. Only valid with https:// URLs; combining
	// any TLS option with an http:// URL is a configuration error.
	TLS TLSConfig `koanf:"tls"`
}

// Validate checks the ArmadaConfig for consistency.
func (a *ArmadaConfig) Validate() error {
	switch {
	case strings.HasPrefix(a.URL, "http://"):
		if !a.TLS.isZero() {
			return fmt.Errorf("armada: TLS options cannot be used with an http:// URL; use https:// to enable TLS")
		}
	case strings.HasPrefix(a.URL, "https://"):
		// TLS options are valid here.
	case strings.HasPrefix(a.URL, "unix://"):
		if !a.TLS.isZero() {
			return fmt.Errorf("armada: TLS options cannot be used with a unix:// URL; use unixs:// to enable TLS")
		}
	case strings.HasPrefix(a.URL, "unixs://"):
		// TLS options are valid here.
	case a.URL == "":
		return fmt.Errorf("armada.url is required")
	default:
		return fmt.Errorf("armada.url must start with http://, https://, unix://, or unixs://, got: %q", a.URL)
	}

	return a.TLS.Validate()
}

// TLSConfig holds TLS settings for Armada connections.
// These settings only apply when the Armada URL uses the https:// scheme.
// Setting any TLS option alongside an http:// URL is a configuration error.
type TLSConfig struct {
	// CACert is the path to a PEM-encoded CA certificate used to verify the
	// server. The file is read once at startup.
	CACert string `koanf:"cacert"`
	// ClientCert is the path to a PEM-encoded client certificate for mTLS.
	// The file is re-read on every TLS handshake so short-lived certificates
	// are picked up automatically without a restart.
	ClientCert string `koanf:"clientcert"`
	// ClientKey is the path to the PEM-encoded private key for ClientCert.
	// Like ClientCert, it is re-read on every TLS handshake.
	ClientKey string `koanf:"clientkey"`
	// ServerName overrides the server name used in TLS SNI and certificate
	// verification. Useful when dialing by IP or an internal hostname that
	// differs from the cert's DNS SANs.
	ServerName string `koanf:"servername"`
	// Insecure disables TLS certificate verification. Do not use in production.
	Insecure bool `koanf:"insecure"`
}

// isZero reports whether no TLS options are set.
func (t *TLSConfig) isZero() bool {
	return t.CACert == "" && t.ClientCert == "" && t.ClientKey == "" &&
		t.ServerName == "" && !t.Insecure
}

// Validate returns an error if the TLS settings are inconsistent.
func (t *TLSConfig) Validate() error {
	if (t.ClientCert == "") != (t.ClientKey == "") {
		return fmt.Errorf("armada.tls: clientcert and clientkey must both be set or both be empty")
	}
	return nil
}

// MetricsConfig holds configuration for the metrics subsystem.
type MetricsConfig struct {
	// StoragePath is the directory used by the embedded TSDB.
	StoragePath string `koanf:"storagepath"`
	// ScrapeInterval is how often metrics are scraped from Armada nodes.
	ScrapeInterval time.Duration `koanf:"scrapeinterval"`
}

// Load loads configuration from defaults, an optional YAML file, and environment
// variables. The config file path is read from ARMADA_CONSOLE_CONFIG; if that env
// var is set the file must exist. If it is not set, "console.yaml" in the current
// directory is loaded if present and silently skipped otherwise.
func Load() (*Config, error) {
	k := koanf.New(".")

	// 1. Defaults.
	defaults := map[string]any{
		"port":                   "8080",
		"armada.url":             "http://localhost:5001",
		"metrics.storagepath":    "/tmp/tsdb",
		"metrics.scrapeinterval": "30s",
	}
	if err := k.Load(confmap.Provider(defaults, "."), nil); err != nil {
		return nil, fmt.Errorf("config: loading defaults: %w", err)
	}

	// 2. YAML config file.
	configFile, explicit := os.LookupEnv(configFileEnv)
	if !explicit {
		configFile = "console.yaml"
	}
	if explicit {
		// Explicitly set path must exist.
		if err := k.Load(file.Provider(configFile), yaml.Parser()); err != nil {
			return nil, fmt.Errorf("config: loading %s: %w", configFile, err)
		}
	} else {
		// Default path is optional.
		if _, err := os.Stat(configFile); err == nil {
			if err := k.Load(file.Provider(configFile), yaml.Parser()); err != nil {
				return nil, fmt.Errorf("config: loading %s: %w", configFile, err)
			}
		}
	}

	// 3. Environment variables (ARMADA_CONSOLE_ prefix, __ as path delimiter).
	if err := k.Load(env.Provider(envPrefix, ".", func(s string) string {
		key := strings.TrimPrefix(s, envPrefix)
		key = strings.ToLower(key)
		key = strings.ReplaceAll(key, envPathDelim, ".")
		return key
	}), nil); err != nil {
		return nil, fmt.Errorf("config: loading environment variables: %w", err)
	}

	var cfg Config
	if err := k.Unmarshal("", &cfg); err != nil {
		return nil, fmt.Errorf("config: unmarshaling: %w", err)
	}

	if err := cfg.Armada.Validate(); err != nil {
		return nil, err
	}

	return &cfg, nil
}
