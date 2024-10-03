package config

import (
	"strings"

	"github.com/aligndx/aligndx/internal/logger"
	"github.com/joho/godotenv"
	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/v2"
	"github.com/nats-io/nats.go"
	"github.com/pocketbase/pocketbase"
	s "github.com/pocketbase/pocketbase/models/settings"
)

// Config struct holds configuration values
type Config struct {
	API  APIConfig  `koanf:"api"`
	MQ   MQConfig   `koanf:"mq"`
	DB   DbConfig   `koanf:"db"`
	SMTP SMTPConfig `koanf:"smtp"`
	S3   S3Config   `koanf:"s3"`
}

type APIConfig struct {
	URL                  string `koanf:"url"`
	DefaultAdminEmail    string `koanf:"defaultadminemail"`
	DefaultAdminPassword string `koanf:"defaultadminpassword"`
}

type MQConfig struct {
	URL    string `koanf:"url"`
	Stream string `koanf:"stream"`
}

type DbConfig struct {
	MigrationsDir string `koanf:"migrations.dir"`
}

type SMTPConfig struct {
	Enabled  bool   `koanf:"enabled"`
	Host     string `koanf:"host"`
	Port     int    `koanf:"port"`
	Password string `koanf:"password"`
	Tls      bool   `koanf:"tlsenabled"`
}

type S3Config struct {
	Enabled        bool   `koanf:"enabled"`
	Bucket         string `koanf:"bucket"`
	AccessKey      string `koanf:"accesskey"`
	Secret         string `koanf:"secret"`
	Endpoint       string `koanf:"endpoint"`
	Region         string `koanf:"region"`
	ForcePathStyle bool   `koanf:"pathStyle"`
}

type ConfigService struct {
	logger *logger.LoggerWrapper
	config *Config
}

func NewConfigService(logger *logger.LoggerWrapper) *ConfigService {
	return &ConfigService{
		logger: logger,
		config: NewConfig(),
	}
}

// NewConfig creates a new Config instance with default values
func NewConfig() *Config {
	return &Config{
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
	}
}

// loadConfig loads configuration from environment variables or a .env file
func (cs *ConfigService) LoadConfig() *Config {
	// Load .env file if present
	if err := godotenv.Load(); err != nil {
		cs.logger.Warn("No .env file found, relying on environment variables", map[string]interface{}{"error": err})
	}

	k := koanf.New(".")

	// Load environment variables and map them to the configuration structure
	k.Load(env.Provider("", ".", func(s string) string {
		return strings.ToLower(strings.ReplaceAll(s, "_", "."))
	}), nil)

	err := k.Unmarshal("", cs.config)
	if err != nil {
		cs.logger.Warn("Could not load config", map[string]interface{}{"error": err})
	}
	return cs.config
}

func (cs *ConfigService) UpdateSettings(settings *s.Settings) *s.Settings {
	settings.Meta.AppName = "server"
	if cs.config.SMTP.Enabled {
		settings.Smtp = s.SmtpConfig{
			Enabled:  cs.config.SMTP.Enabled,
			Host:     cs.config.SMTP.Host,
			Port:     cs.config.SMTP.Port,
			Password: cs.config.SMTP.Password,
			Tls:      cs.config.SMTP.Tls,
		}
	}

	if cs.config.S3.Enabled {
		settings.S3 = s.S3Config{
			Enabled:        cs.config.S3.Enabled,
			Bucket:         cs.config.S3.Bucket,
			AccessKey:      cs.config.S3.AccessKey,
			Secret:         cs.config.S3.Secret,
			Endpoint:       cs.config.S3.Endpoint,
			Region:         cs.config.S3.Region,
			ForcePathStyle: cs.config.S3.ForcePathStyle,
		}
	}
	return settings
}
func (cs *ConfigService) SetPBSettings(app *pocketbase.PocketBase) {
	dao := app.Dao()
	if dao == nil {
		cs.logger.Fatal("app.Dao() returned nil")
	}

	settings, err := dao.FindSettings()
	if err != nil {
		cs.logger.Warn("Failed to find settings, using default settings", map[string]interface{}{"error": err})
		settings = &s.Settings{} // Initialize settings with a default value
	}
	newSettings := cs.UpdateSettings(settings)
	err = dao.SaveSettings(newSettings)
	if err != nil {
		cs.logger.Warn("Failed to save settings", map[string]interface{}{"error": err.Error()})
		return
	}
}
