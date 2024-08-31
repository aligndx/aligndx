package main

import (
	"context"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/jobs"
	"github.com/aligndx/aligndx/internal/jobs/handlers/workflow"
	"github.com/aligndx/aligndx/internal/jobs/mq"
	"github.com/aligndx/aligndx/internal/logger"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	log := logger.NewLoggerWrapper("zerolog", ctx)
	configService := config.NewConfigService(log)
	cfg := configService.LoadConfig()

	mqService, err := mq.NewJetStreamMessageQueueService(ctx, cfg.MQ.URL, cfg.MQ.Stream, "jobs", log)
	if err != nil {
		log.Fatal("Failed to initialize message queue service", map[string]interface{}{"error": err.Error()})
		return
	}

	// Initialize job service
	jobService := jobs.NewJobService(mqService, log, cfg, cfg.MQ.Stream, "jobs")

	// Register job handlers
	jobService.RegisterJobHandler("workflow", workflow.WorkflowHandler)

	// Initialize worker
	worker := jobs.NewWorker(jobService, log, cfg)

	// Start worker
	worker.Start(ctx, cancel)
}
