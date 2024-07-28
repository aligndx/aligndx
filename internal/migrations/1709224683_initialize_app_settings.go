package migrations

import (
	"github.com/aligndx/aligndx/internal/config"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		dao := daos.New(db)
		configService := config.NewConfigService(nil)
		settings, _ := dao.FindSettings()
		configService.LoadConfig()
		newSettings := configService.UpdateSettings(settings)

		return dao.SaveSettings(newSettings)

	}, nil)
}
