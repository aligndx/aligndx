package jobs

import (
	"context"
	"os"
	"os/signal"
	"sync"
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

func (w *Worker) Start(ctx context.Context, cancel context.CancelFunc) {
	var wg sync.WaitGroup

	// Capture OS signals for graceful shutdown
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigs
		w.log.Info("Shutting down worker...")
		cancel()
	}()

	w.log.Info("Starting worker to process jobs...")

	wg.Add(1)
	go func() {
		defer wg.Done()
		err := w.jobService.ProcessJobs(ctx, 2)
		if err != nil {
			w.log.Error("Error processing jobs", map[string]interface{}{"error": err.Error()})
			time.Sleep(5 * time.Second)
		}
	}()

	<-ctx.Done()
	w.log.Info("Worker has been shut down")

	// Wait for all goroutines to finish
	wg.Wait()
}
