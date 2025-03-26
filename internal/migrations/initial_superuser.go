package migrations

import (
	"github.com/aligndx/aligndx/internal/config"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {

	configManager := config.NewConfigManager()
	cfg := configManager.GetConfig()
	m.Register(func(app core.App) error {

		superusers, err := app.FindCollectionByNameOrId(core.CollectionNameSuperusers)
		if err != nil {
			return err
		}

		record := core.NewRecord(superusers)

		record.Set("email", cfg.API.DefaultAdminEmail)
		record.Set("password", cfg.API.DefaultAdminPassword)

		return app.Save(record)
	}, func(app core.App) error { // optional revert operation
		record, _ := app.FindAuthRecordByEmail(core.CollectionNameSuperusers, cfg.API.DefaultAdminEmail)
		if record == nil {
			return nil // probably already deleted
		}

		return app.Delete(record)
	})
}
