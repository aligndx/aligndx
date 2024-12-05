package cmd

import (
	"context"
	"sync"

	"github.com/aligndx/aligndx/internal/httpserver"
	"github.com/aligndx/aligndx/internal/jobs"
	"github.com/aligndx/aligndx/internal/logger"
	"github.com/aligndx/aligndx/internal/nats"
	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Starts the Aligndx platform",
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := context.Background()
		log := logger.NewLoggerWrapper("zerolog", ctx)

		// Step 1: Start NATS server
		log.Info("Starting NATS server...")
		if err := nats.StartNATSServer(ctx, false); err != nil {
			return err
		}
		log.Info("NATS server started successfully.")

		// Step 2: Start worker and serve concurrently
		var wg sync.WaitGroup
		wg.Add(2)

		// Start worker
		go func() {
			defer wg.Done()
			log.Info("Starting worker...")
			ctxWorker, cancelWorker := context.WithCancel(ctx)
			defer cancelWorker()
			if err := jobs.StartWorker(ctxWorker, cancelWorker); err != nil {
				log.Fatal("Worker exited with error: %v\n", map[string]interface{}{"error": err})
			} else {
				log.Info("Worker started successfully.")
			}
		}()

		// Start HTTP server
		go func() {
			defer wg.Done()
			log.Info("Starting HTTP server...")
			allowedOrigins := []string{"*"}
			httpAddr := ""  // Set your desired HTTP address here
			httpsAddr := "" // Set your desired HTTPS address here
			if err := httpserver.StartHTTPServer(ctx, rootCmd, args, allowedOrigins, httpAddr, httpsAddr, false); err != nil {
				log.Fatal("HTTP server exited with error: %v\n", map[string]interface{}{"error": err})
			} else {
				log.Info("HTTP server started successfully.")
			}
		}()

		// Wait for worker and server to complete
		wg.Wait()

		return nil
	},
}

func init() {
	rootCmd.AddCommand(startCmd)
}
