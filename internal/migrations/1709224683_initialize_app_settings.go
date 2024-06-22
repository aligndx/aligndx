package migrations

import (
	"errors"
	"log"
	"os"
	"strconv"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	s "github.com/pocketbase/pocketbase/models/settings"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		dao := daos.New(db)

		pathStyle := false
		environment := os.Getenv("ENVIRONMENT")
		if environment == "development" {
			pathStyle = true
		}
		settings, _ := dao.FindSettings()
		settings.Meta.AppName = "server"
		if smtpEnabled, err := strconv.ParseBool(os.Getenv("SMTP_ENABLED")); err == nil && smtpEnabled {
			port, err := strconv.Atoi(os.Getenv("SMTP_PORT"))
			if err != nil {
				return errors.New("invalid SMTP_PORT value")
			}

			settings.Smtp = s.SmtpConfig{
				Enabled:  true,
				Host:     os.Getenv("SMTP_HOST"),
				Port:     port,
				Password: os.Getenv("SMTP_PASSWORD"),
				Tls:      false,
			}
		} else if err != nil {
			log.Printf("Error parsing SMTP_ENABLED: %v", err)
		}

		if s3_enabled, s3_config_err := strconv.ParseBool(os.Getenv("S3_ENABLED")); s3_config_err == nil && s3_enabled {
			settings.S3 = s.S3Config{
				Enabled:        s3_enabled,
				Bucket:         os.Getenv("AWS_BUCKET"),
				AccessKey:      os.Getenv("AWS_ACCESS_KEY"),
				Secret:         os.Getenv("AWS_SECRET"),
				Endpoint:       os.Getenv("AWS_ENDPOINT"),
				Region:         os.Getenv("AWS_REGION"),
				ForcePathStyle: pathStyle,
			}
		}

		return dao.SaveSettings(settings)

	}, nil)
}
