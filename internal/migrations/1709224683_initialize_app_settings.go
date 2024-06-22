package migrations

import (
	"github.com/aligndx/aligndx/internal/config"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	s "github.com/pocketbase/pocketbase/models/settings"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		dao := daos.New(db)
		cfg := config.GetConfig()

		settings, _ := dao.FindSettings()
		settings.Meta.AppName = "server"
		if cfg.SMTP.Enabled {
			settings.Smtp = s.SmtpConfig{
				Enabled:  cfg.SMTP.Enabled,
				Host:     cfg.SMTP.Host,
				Port:     cfg.SMTP.Port,
				Password: cfg.SMTP.Password,
				Tls:      cfg.SMTP.Tls,
			}
		}

		if cfg.S3.Enabled {
			settings.S3 = s.S3Config{
				Enabled:        cfg.S3.Enabled,
				Bucket:         cfg.S3.Bucket,
				AccessKey:      cfg.S3.AccessKey,
				Secret:         cfg.S3.Secret,
				Endpoint:       cfg.S3.Endpoint,
				Region:         cfg.S3.Region,
				ForcePathStyle: cfg.S3.ForcePathStyle,
			}
		}

		return dao.SaveSettings(settings)

	}, nil)
}
