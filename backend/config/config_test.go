package config

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestArmadaConfigValidate(t *testing.T) {
	tests := []struct {
		name    string
		cfg     ArmadaConfig
		wantErr bool
	}{
		{
			name:    "http without TLS is valid",
			cfg:     ArmadaConfig{URL: "http://localhost:5001"},
			wantErr: false,
		},
		{
			name:    "https without TLS options is valid",
			cfg:     ArmadaConfig{URL: "https://armada.example.com:5001"},
			wantErr: false,
		},
		{
			name: "https with TLS options is valid",
			cfg: ArmadaConfig{
				URL: "https://armada.example.com:5001",
				TLS: TLSConfig{CACert: "/etc/ca.pem"},
			},
			wantErr: false,
		},
		{
			name: "http with cacert is an error",
			cfg: ArmadaConfig{
				URL: "http://armada.example.com:5001",
				TLS: TLSConfig{CACert: "/etc/ca.pem"},
			},
			wantErr: true,
		},
		{
			name: "http with insecure flag is an error",
			cfg: ArmadaConfig{
				URL: "http://armada.example.com:5001",
				TLS: TLSConfig{Insecure: true},
			},
			wantErr: true,
		},
		{
			name:    "unix without TLS is valid",
			cfg:     ArmadaConfig{URL: "unix:///var/run/armada.sock"},
			wantErr: false,
		},
		{
			name:    "unixs without TLS options is valid",
			cfg:     ArmadaConfig{URL: "unixs:///var/run/armada.sock"},
			wantErr: false,
		},
		{
			name: "unix with TLS options is an error",
			cfg: ArmadaConfig{
				URL: "unix:///var/run/armada.sock",
				TLS: TLSConfig{CACert: "/etc/ca.pem"},
			},
			wantErr: true,
		},
		{
			name:    "empty URL is an error",
			cfg:     ArmadaConfig{URL: ""},
			wantErr: true,
		},
		{
			name:    "unsupported scheme is an error",
			cfg:     ArmadaConfig{URL: "grpc://armada.example.com:5001"},
			wantErr: true,
		},
		{
			name:    "no scheme is an error",
			cfg:     ArmadaConfig{URL: "armada.example.com:5001"},
			wantErr: true,
		},
		{
			name: "https with mtls cert pair is valid",
			cfg: ArmadaConfig{
				URL: "https://armada.example.com:5001",
				TLS: TLSConfig{ClientCert: "/etc/client.pem", ClientKey: "/etc/client.key"},
			},
			wantErr: false,
		},
		{
			name: "https with cert but no key is an error",
			cfg: ArmadaConfig{
				URL: "https://armada.example.com:5001",
				TLS: TLSConfig{ClientCert: "/etc/client.pem"},
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.cfg.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestTLSConfigValidate(t *testing.T) {
	tests := []struct {
		name    string
		cfg     TLSConfig
		wantErr bool
	}{
		{
			name:    "empty is valid",
			cfg:     TLSConfig{},
			wantErr: false,
		},
		{
			name:    "both cert and key set is valid",
			cfg:     TLSConfig{ClientCert: "/etc/client.pem", ClientKey: "/etc/client.key"},
			wantErr: false,
		},
		{
			name:    "cert without key is an error",
			cfg:     TLSConfig{ClientCert: "/etc/client.pem"},
			wantErr: true,
		},
		{
			name:    "key without cert is an error",
			cfg:     TLSConfig{ClientKey: "/etc/client.key"},
			wantErr: true,
		},
		{
			name:    "cacert only is valid",
			cfg:     TLSConfig{CACert: "/etc/ca.pem"},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.cfg.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestLoad_Defaults(t *testing.T) {
	// Run in an empty temp dir so console.yaml is not found.
	t.Chdir(t.TempDir())

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.Port != "8080" {
		t.Errorf("Port = %q, want %q", cfg.Port, "8080")
	}
	if cfg.Armada.URL != "http://localhost:5001" {
		t.Errorf("Armada.URL = %q, want %q", cfg.Armada.URL, "http://localhost:5001")
	}
	if cfg.Metrics.StoragePath != "/tmp/tsdb" {
		t.Errorf("Metrics.StoragePath = %q, want %q", cfg.Metrics.StoragePath, "/tmp/tsdb")
	}
	if cfg.Metrics.ScrapeInterval != 30*time.Second {
		t.Errorf("Metrics.ScrapeInterval = %v, want %v", cfg.Metrics.ScrapeInterval, 30*time.Second)
	}
}

func TestLoad_EnvOverridesDefault(t *testing.T) {
	t.Chdir(t.TempDir())
	t.Setenv("ARMADA_CONSOLE_PORT", "9090")
	t.Setenv("ARMADA_CONSOLE_ARMADA__URL", "https://armada.example.com:5001")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.Port != "9090" {
		t.Errorf("Port = %q, want %q", cfg.Port, "9090")
	}
	if cfg.Armada.URL != "https://armada.example.com:5001" {
		t.Errorf("Armada.URL = %q, want %q", cfg.Armada.URL, "https://armada.example.com:5001")
	}
}

func TestLoad_YAMLFile(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	yaml := `
port: "9191"
armada:
  url: https://armada.example.com:5001
  token: secret
`
	if err := os.WriteFile(filepath.Join(dir, "console.yaml"), []byte(yaml), 0o600); err != nil {
		t.Fatal(err)
	}

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.Port != "9191" {
		t.Errorf("Port = %q, want %q", cfg.Port, "9191")
	}
	if cfg.Armada.Token != "secret" {
		t.Errorf("Armada.Token = %q, want %q", cfg.Armada.Token, "secret")
	}
}

func TestLoad_ExplicitConfigEnvMissing(t *testing.T) {
	t.Chdir(t.TempDir())
	t.Setenv("ARMADA_CONSOLE_CONFIG", "/nonexistent/console.yaml")

	_, err := Load()
	if err == nil {
		t.Fatal("Load() expected error for missing explicit config file, got nil")
	}
}

func TestLoad_ExplicitConfigEnvPresent(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	cfgPath := filepath.Join(dir, "my-config.yaml")
	yaml := `
port: "7777"
armada:
  url: https://armada.example.com:5001
`
	if err := os.WriteFile(cfgPath, []byte(yaml), 0o600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("ARMADA_CONSOLE_CONFIG", cfgPath)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.Port != "7777" {
		t.Errorf("Port = %q, want %q", cfg.Port, "7777")
	}
}

func TestLoad_EnvOverridesYAML(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	yaml := `
port: "9191"
armada:
  url: https://armada.example.com:5001
`
	if err := os.WriteFile(filepath.Join(dir, "console.yaml"), []byte(yaml), 0o600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("ARMADA_CONSOLE_PORT", "8888")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.Port != "8888" {
		t.Errorf("Port = %q, want %q (env should override YAML)", cfg.Port, "8888")
	}
}

func TestLoad_InvalidSchemeFromEnv(t *testing.T) {
	t.Chdir(t.TempDir())
	t.Setenv("ARMADA_CONSOLE_ARMADA__URL", "grpc://armada.example.com:5001")

	_, err := Load()
	if err == nil {
		t.Fatal("Load() expected validation error for unsupported scheme, got nil")
	}
}

func TestLoad_TLSWithHTTPFromEnv(t *testing.T) {
	t.Chdir(t.TempDir())
	t.Setenv("ARMADA_CONSOLE_ARMADA__URL", "http://armada.example.com:5001")
	t.Setenv("ARMADA_CONSOLE_ARMADA__TLS__CACERT", "/etc/ca.pem")

	_, err := Load()
	if err == nil {
		t.Fatal("Load() expected validation error for TLS with http://, got nil")
	}
}
