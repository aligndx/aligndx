package main

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/jobs"
	"github.com/aligndx/aligndx/internal/jobs/mq"
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

	mqService, err := mq.NewJetStreamMessageQueueService(ctx, cfg.MQ.URL, cfg.MQ.Stream, "jobs.>", log)
	if err != nil {
		log.Fatal("Failed to initialize message queue service", map[string]interface{}{"error": err})
		return
	}
	jobService := jobs.NewJobService(mqService, log, cfg, cfg.MQ.Stream, "jobs")

	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	app.OnAfterBootstrap().Add(func(e *core.BootstrapEvent) error {
		// configService.SetPBSettings(app)
		return nil
	})

	app.OnRecordAfterCreateRequest("submissions").Add(func(e *core.RecordCreateEvent) error {
		record := e.Record
		result := map[string]interface{}{}
		record.UnmarshalJSONField("inputs", &result)

		// workflowRecordID := record.GetString("workflow")
		// workflowRecord, err := app.Dao().FindRecordById("workflows", workflowRecordID)
		// if err != nil {
		// 	log.Error("Failed to fetch workflow record", map[string]interface{}{"error": err})
		// 	return err
		// }
		// workflowRepo := workflowRecord.GetString("repository")
		// println(workflowRepo)
		jobID := e.Record.Id

		queue_err := jobService.QueueJob(ctx, jobID, result, "workflow")
		if queue_err != nil {
			log.Error("Failed to queue job", map[string]interface{}{"error": err})
			return err
		}

		log.Info(fmt.Sprintf("Job %s successfully queued", jobID))

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
