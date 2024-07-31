package main

import (
	"context"
	"os"
	"strings"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/logger"
	_ "github.com/aligndx/aligndx/internal/migrations"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
)

var log *logger.LoggerWrapper

func main() {
	ctx := context.Background()
	app := pocketbase.New()
	log = logger.NewLoggerWrapper("zerolog", ctx)
	configService := config.NewConfigService(log)
	cfg := configService.LoadConfig()

	log.Info("App started")

	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	app.OnAfterBootstrap().Add(func(e *core.BootstrapEvent) error {
		configService.SetPBSettings(app)
		return nil
	})

	app.OnRecordAfterCreateRequest("submissions").Add(func(e *core.RecordCreateEvent) error {
		// Extract the submission inputs
		// Submit a background job
		log.Info("Submission received", map[string]interface{}{
			"http_context":   e.HttpContext,
			"record":         e.Record,
			"uploaded_files": e.UploadedFiles,
		})
		return nil
	})

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		// enable auto creation of migration files when making collection changes in the Admin UI
		// (the isGoRun check is to enable it only during development)
		Dir:         cfg.DB.MigrationsDir, // path to migration files
		Automigrate: isGoRun,
	})

	if err := app.Start(); err != nil {
		log.Fatal("Error starting the application", map[string]interface{}{"error": err})
	}
}
