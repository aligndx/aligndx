package cmd

import (
	"context"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/httpserver"
	"github.com/aligndx/aligndx/internal/jobs"
	"github.com/aligndx/aligndx/internal/jobs/mq"
	"github.com/aligndx/aligndx/internal/logger" // Import PocketBase commands
	"github.com/spf13/cobra"
)

// NewCustomServeCommand wraps PocketBase's serve command with your own logic.
func NewCustomServeCommand() *cobra.Command {
	command := &cobra.Command{
		Use:   "serve",
		Short: "Initialize aligndx server",
		RunE: func(cmd *cobra.Command, args []string) error {
			// Step 1: Run your own initialization logic
			ctx := context.Background()
			log := logger.NewLoggerWrapper("zerolog", ctx)

			// Load configuration
			configService := config.NewConfigService(log)
			cfg := configService.LoadConfig()

			// Initialize message queue service
			mqService, err := mq.NewJetStreamMessageQueueService(ctx, cfg.MQ.URL, cfg.MQ.Stream, "jobs.>", log)
			if err != nil {
				log.Fatal("Failed to initialize message queue service", map[string]interface{}{"error": err})
				return err
			}

			// Initialize job service
			jobService := jobs.NewJobService(mqService, log, cfg, cfg.MQ.Stream, "jobs")

			// Start HTTP server and PocketBase app
			app, err := httpserver.StartHTTPServer(ctx, rootCmd, cfg, jobService, log)
			if err != nil {
				log.Fatal("Failed to configure HTTP server", map[string]interface{}{"error": err})
				return err
			}

			// Ensure the app is bootstrapped and ready to serve
			err = app.Start() // This registers and executes all necessary commands including the serve command
			if err != nil {
				log.Fatal("Failed to start PocketBase app", map[string]interface{}{"error": err})
				return err
			}

			return nil
		},
	}

	return command
}

func init() {
	// Add your custom serve command to the rootCmd
	rootCmd.AddCommand(NewCustomServeCommand())
}
