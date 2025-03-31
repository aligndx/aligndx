package cmd

import (
	"context"
	"fmt"
	"sync"

	"github.com/aligndx/aligndx/internal/jobs"
	"github.com/aligndx/aligndx/internal/logger"
	"github.com/aligndx/aligndx/internal/nats"
	"github.com/aligndx/aligndx/internal/pb"
	"github.com/aligndx/aligndx/internal/uiserver"
	"github.com/spf13/cobra"
)

func StartCommand(rootCmd *cobra.Command) *cobra.Command {
	command := &cobra.Command{
		Use:   "start",
		Short: "Starts the Aligndx platform",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			log := logger.NewLoggerWrapper("zerolog", ctx)

			// Step 1: Start MQ
			log.Info("Starting message queue...")
			if err := nats.StartNATSServer(ctx, false); err != nil {
				return err
			}
			log.Debug("Message queue started successfully.")

			// Step 2: Start worker and serve concurrently
			var wg sync.WaitGroup
			wg.Add(3)

			// Start worker
			go func() {
				defer wg.Done()
				log.Info("Starting worker...")
				ctxWorker, cancelWorker := context.WithCancel(ctx)
				defer cancelWorker()
				if err := jobs.StartWorker(ctxWorker, cancelWorker); err != nil {
					log.Fatal("Worker exited with error: %v\n", map[string]interface{}{"error": err})
				} else {
					log.Debug("Worker started successfully.")
				}
			}()

			// Start HTTP server
			go func() {
				defer wg.Done()
				allowedOrigins := []string{"*"}
				httpAddr := "0.0.0.0:8090" // Set your desired HTTP address here
				httpsAddr := ""            // Set your desired HTTPS address here
				port := "8090"
				log.Info(fmt.Sprintf("Starting HTTP server with admin UI on http://localhost:%s/_/...", port))
				pbApp, err := pb.CreatePbApp(rootCmd)
				if err != nil {
					log.Fatal("PB creation exited with error: %v\n", map[string]interface{}{"error": err})
				}

				if err := pb.StartPBServer(ctx, pbApp, args, allowedOrigins, httpAddr, httpsAddr, false); err != nil {
					log.Fatal("HTTP server exited with error: %v\n", map[string]interface{}{"error": err.Error()})
				} else {
					log.Info("HTTP server started successfully.")
				}
			}()

			// Start UI server
			go func() {
				defer wg.Done()
				port := "3000"
				log.Info(fmt.Sprintf("Starting UI server on http://localhost:%s...", port))
				uiserver.StartUIServer(port)
			}()

			// Wait for worker and server to complete
			wg.Wait()

			return nil
		},
	}

	return command
}
