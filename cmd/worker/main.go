package main

import (
	"context"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/jobs"
	"github.com/aligndx/aligndx/internal/jobs/mq"
	"github.com/aligndx/aligndx/internal/logger"
)

func main() {
	ctx := context.Background()
	log := logger.NewLoggerWrapper("zerolog", ctx)
	configService := config.NewConfigService(log)
	cfg := configService.LoadConfig()

	mqService, err := mq.NewJetStreamMessageQueueService(cfg.MQ.URL, cfg.MQ.Stream, "jobs")
	if err != nil {
		log.Fatal("Failed to initialize message queue service", map[string]interface{}{"error": err})
		return
	}

	// Initialize job service
	jobService := jobs.NewJobService(mqService, log, cfg, cfg.MQ.Stream)

	// Register job handlers
	jobService.RegisterJobHandler("workflow", jobs.WorkflowHandler)

	// Initialize worker
	worker := jobs.NewWorker(jobService, log, cfg)

	// Start worker
	worker.Start()

}
