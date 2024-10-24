package cmd

import (
	"context"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/jobs"
	"github.com/aligndx/aligndx/internal/jobs/handlers/workflow"
	"github.com/aligndx/aligndx/internal/jobs/mq"
	"github.com/aligndx/aligndx/internal/logger" // Import PocketBase commands
	"github.com/spf13/cobra"
)

func WorkerCommand() *cobra.Command {
	command := &cobra.Command{
		Use:   "worker",
		Short: "Starts a worker",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()

			log := logger.NewLoggerWrapper("zerolog", ctx)

			configService := config.NewConfigService(log)
			cfg := configService.LoadConfig()

			mqService, err := mq.NewJetStreamMessageQueueService(ctx, cfg.MQ.URL, cfg.MQ.Stream, "jobs.>", log)
			if err != nil {
				log.Fatal("Failed to initialize message queue service", map[string]interface{}{"error": err})
				return err
			}

			// Initialize job service
			jobService := jobs.NewJobService(mqService, log, cfg, cfg.MQ.Stream, "jobs")

			// Register job handlers
			jobService.RegisterJobHandler("workflow", workflow.WorkflowHandler)

			// Initialize worker
			worker := jobs.NewWorker(jobService, log, cfg)

			// Start worker
			worker.Start(ctx, cancel)
			return nil
		},
	}

	return command
}

func init() {
	// Add your custom serve command to the rootCmd
	rootCmd.AddCommand(WorkerCommand())
}
