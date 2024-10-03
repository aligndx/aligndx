package migrations

import (
	"context"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/logger"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		dao := daos.New(db)
		ctx := context.Background()

		log := logger.NewLoggerWrapper("zerolog", ctx)

		configService := config.NewConfigService(log)
		settings, _ := dao.FindSettings()
		configService.LoadConfig()
		newSettings := configService.UpdateSettings(settings)

		return dao.SaveSettings(newSettings)

	}, nil)
}
