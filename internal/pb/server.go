package pb

import (
	"os"
	"strings"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/cmd"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/spf13/cobra"
)

func CreatePbApp(rootcmd *cobra.Command) (*pocketbase.PocketBase, error) {

	configManager := config.NewConfigManager()
	cfg := configManager.GetConfig()
	app := pocketbase.New()
	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	migratecmd.MustRegister(app, rootcmd, migratecmd.Config{
		Dir:         cfg.DB.MigrationsDir,
		Automigrate: isGoRun,
	})
	rootcmd.AddCommand(cmd.NewSuperuserCommand(app))

	app.Bootstrap()

	return app, nil
}
