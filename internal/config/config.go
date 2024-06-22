package config

import (
	"log"
	"strings"
	"sync"

	"github.com/joho/godotenv"
	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/v2"
)

// Config struct holds configuration values
type Config struct {
	Nats NatsConfig `koanf:"nats"`
}

// NatsConfig settings
type NatsConfig struct {
	InMemory bool   `koanf:"in_memory"`
	URL      string `koanf:"url"`
}

var (
	cfg  *Config
	once sync.Once
)

// LoadConfig loads configuration from environment variables or a .env file
func loadConfig() (*Config, error) {
	// Load .env file if present
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env file found, relying on environment variables. Error: %v", err)
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
			log.Fatalf("Could not load config: %v", err)
		}
	})
	return cfg
}
