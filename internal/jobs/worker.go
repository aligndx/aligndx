package jobs

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/logger"
)

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

func (w *Worker) Start() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Capture OS signals for graceful shutdown
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigs
		w.log.Info("Shutting down worker...", nil)
		cancel()
	}()

	w.log.Info("Starting worker to process jobs...", nil)

	// Continuously process jobs
	for {
		err := w.jobService.ProcessJobs(ctx)
		if err != nil {
			w.log.Error("Error processing jobs", map[string]interface{}{"error": err})
			time.Sleep(5 * time.Second) // Backoff before retrying
		}

		select {
		case <-ctx.Done():
			w.log.Info("Worker has been shut down", nil)
			return
		default:
			// Continue processing jobs
		}
	}
}
