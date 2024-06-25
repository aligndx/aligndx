package config

import (
	"strings"
	"sync"

	"github.com/aligndx/aligndx/internal/logger"
	"github.com/joho/godotenv"
	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/v2"
	"github.com/nats-io/nats.go"
)

// Config struct holds configuration values
type Config struct {
	Nats NatsConfig `koanf:"nats"`
	DB   DbConfig   `koanf:"db"`
	SMTP SMTPConfig `koanf:"smtp"`
	S3   S3Config   `koanf:"s3"`
}

// NatsConfig settings
type NatsConfig struct {
	InMemory bool   `koanf:"in_memory"`
	URL      string `koanf:"url"`
}

type DbConfig struct {
	MigrationsDir string `koanf:"migrations_dir"`
}

type SMTPConfig struct {
	Enabled  bool   `koanf:"smtp_enabled"`
	Host     string `koanf:"smtp_host"`
	Port     int    `koanf:"smtp_port"`
	Password string `koanf:"smtp_password"`
	Tls      bool   `koanf:"smtp_tls_enabled"`
}

type S3Config struct {
	Enabled        bool   `koanf:"s3_enabled"`
	Bucket         string `koanf:"s3_bucket"`
	AccessKey      string `koanf:"aws_access_key"`
	Secret         string `koanf:"aws_secret"`
	Endpoint       string `koanf:"aws_endpoint"`
	Region         string `koanf:"aws_region"`
	ForcePathStyle bool   `koanf:"pathStyle"`
}

var (
	cfg  *Config
	once sync.Once
	log  *logger.LoggerWrapper
)

// NewConfig creates a new Config instance with default values
func NewConfig() *Config {
	return &Config{
		Nats: NatsConfig{
			InMemory: false,
			URL:      nats.DefaultURL,
		},
		DB: DbConfig{
			MigrationsDir: "migrations",
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
	}
}

// LoadConfig loads configuration from environment variables or a .env file
func loadConfig() (*Config, error) {
	// Load .env file if present
	if err := godotenv.Load(); err != nil {
		log.Warn("No .env file found, relying on environment variables", map[string]interface{}{"error": err})
	}

	k := koanf.New(".")

	// Load environment variables and map them to the configuration structure
	k.Load(env.Provider("", ".", func(s string) string {
		return strings.ToLower(strings.ReplaceAll(s, "_", "."))
	}), nil)

	config := &Config{}
	if err := k.Unmarshal("", config); err != nil {
		return nil, err
	}

	return config, nil
}

// GetConfig ensures the config is loaded only once and returns it
func GetConfig() *Config {
	once.Do(func() {
		var err error
		cfg, err = loadConfig()
		if err != nil {
			log.Fatal("Could not load config", map[string]interface{}{"error": err})
		}
	})
	return cfg
}
