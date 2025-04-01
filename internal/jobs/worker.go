package jobs

import (
	"context"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/jobs/handlers/workflow"
	"github.com/aligndx/aligndx/internal/logger"
)

// Start initializes the worker's dependencies and starts the job processing.
func StartWorker(ctx context.Context, cancel context.CancelFunc) error {
	// Initialize logger
	log := logger.NewLoggerWrapper("zerolog", ctx)

	configManager := config.NewConfigManager()
	cfg := configManager.GetConfig()

	// Initialize job service
	jobService, err := NewJobService(ctx, log, cfg)
	if err != nil {
		log.Fatal("Failed to setup job service", map[string]interface{}{"error": err})
		return err
	}

	// Register job handlers.
	jobService.RegisterJobHandler("workflow", workflow.WorkflowHandler)

	// Create a worker instance and run it.
	worker := NewWorker(jobService, log, cfg)
	return worker.Run(ctx, cancel) // Changed from Start to Run for clarity.
}

// Worker struct manages the job processing.
type Worker struct {
	jobService JobServiceInterface
	log        *logger.LoggerWrapper
	cfg        *config.Config
}

func NewWorker(jobService JobServiceInterface, log *logger.LoggerWrapper, cfg *config.Config) *Worker {
	return &Worker{
		jobService: jobService,
		log:        log,
		cfg:        cfg,
	}
}

// Run starts processing jobs and listens for graceful shutdown signals.
func (w *Worker) Run(ctx context.Context, cancel context.CancelFunc) error { // Changed from Start to Run
	var wg sync.WaitGroup
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	// Handle shutdown signal
	go func() {
		<-sigs
		w.log.Info("Shutting down worker...")
		cancel()
	}()

	w.log.Debug("Starting worker to process jobs...")

	// Start processing jobs
	wg.Add(1)
	go func() {
		defer wg.Done()
		err := w.jobService.Process(ctx, 2)
		if err != nil {
			w.log.Error("Error processing jobs", map[string]interface{}{"error": err.Error()})
			time.Sleep(5 * time.Second)
		}
	}()

	<-ctx.Done()
	w.log.Debug("Worker has been shut down")
	wg.Wait()
	return nil
}
