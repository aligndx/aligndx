package config

import (
	"log"
	"strings"
	"sync"

	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/v2"
	"github.com/nats-io/nats.go"
	"github.com/pocketbase/pocketbase"
)

// Prefix for environment variables
const envPrefix = "ALIGNDX_"

// Config represents the top-level configuration structure
type Config struct {
	API  APIConfig  `koanf:"api"`
	MQ   MQConfig   `koanf:"mq"`
	DB   DbConfig   `koanf:"db"`
	SMTP SMTPConfig `koanf:"smtp"`
	S3   S3Config   `koanf:"s3"`
	NXF  NXFConfig  `koanf:"nxf"`
}

// APIConfig holds configuration for the API
type APIConfig struct {
	URL                  string `koanf:"url"`
	DefaultAdminEmail    string `koanf:"default_admin_email"`
	DefaultAdminPassword string `koanf:"default_admin_password"`
}

// MQConfig holds configuration for the message queue
type MQConfig struct {
	URL    string `koanf:"url"`
	Stream string `koanf:"stream"`
}

// DbConfig holds database-related configuration
type DbConfig struct {
	MigrationsDir string `koanf:"migrations_dir"`
}

// SMTPConfig holds SMTP configuration
type SMTPConfig struct {
	Enabled  bool   `koanf:"enabled"`
	Host     string `koanf:"host"`
	Port     int    `koanf:"port"`
	Password string `koanf:"password"`
	Tls      bool   `koanf:"tls"`
}

// S3Config holds configuration for S3 storage
type S3Config struct {
	Enabled        bool   `koanf:"enabled"`
	Bucket         string `koanf:"bucket"`
	AccessKey      string `koanf:"access_key"`
	Secret         string `koanf:"secret"`
	Endpoint       string `koanf:"endpoint"`
	Region         string `koanf:"region"`
	ForcePathStyle bool   `koanf:"force_path_style"`
}

// NXFConfig holds configuration for NXF
type NXFConfig struct {
	DefaultDir            string `koanf:"default_dir"`
	PluginsTestRepository string `koanf:"plugins_test_repository"`
}

// ConfigManager handles configuration loading and access
type ConfigManager struct {
	mu   sync.RWMutex
	ko   *koanf.Koanf
	data *Config
}

// NewConfigManager initializes the configuration with defaults and loads environment variables
func NewConfigManager() *ConfigManager {
	ko := koanf.New(".")
	manager := &ConfigManager{
		ko: ko,
		data: &Config{
			API: APIConfig{
				URL:                  pocketbase.New().Settings().Meta.AppUrl,
				DefaultAdminEmail:    "",
				DefaultAdminPassword: "",
			},
			MQ: MQConfig{
				URL:    nats.DefaultURL,
				Stream: "JOBS",
			},
			DB: DbConfig{
				MigrationsDir: "internal/migrations",
			},
			SMTP: SMTPConfig{
				Enabled:  false,
				Host:     "localhost",
				Port:     25,
				Password: "123456",
				Tls:      false,
			},
			S3: S3Config{
				Enabled:        false,
				Bucket:         "default-bucket",
				AccessKey:      "default-access-key",
				Secret:         "default-secret",
				Endpoint:       "default-endpoint",
				Region:         "us-west-1",
				ForcePathStyle: false,
			},
			NXF: NXFConfig{
				DefaultDir:            "workflows",
				PluginsTestRepository: "",
			},
		},
	}

	if err := manager.loadConfig(); err != nil {
		log.Fatalf("error loading configuration: %v", err)
	}

	return manager
}

// loadConfig loads environment variables into the configuration struct
func (c *ConfigManager) loadConfig() error {
	transform := func(s string) string {
		// Strip the prefix, replace underscores with dots, and convert to lowercase
		return strings.Replace(strings.ToLower(strings.TrimPrefix(s, envPrefix)), "_", ".", -1)
	}

	// Load environment variables with the defined prefix and transformation
	if err := c.ko.Load(env.Provider(envPrefix, ".", transform), nil); err != nil {
		return err
	}

	// Unmarshal loaded values into the Config struct
	return c.ko.Unmarshal("", c.data)
}

// GetConfig safely retrieves the current configuration data
func (c *ConfigManager) GetConfig() *Config {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.data
}

// SetConfig safely updates the configuration data
func (c *ConfigManager) SetConfig(newConfig *Config) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.data = newConfig
}

// Reload reloads environment variables into the configuration
func (c *ConfigManager) Reload() {
	c.mu.Lock()
	defer c.mu.Unlock()
	if err := c.loadConfig(); err != nil {
		log.Fatalf("error reloading configuration: %v", err)
	}
}
