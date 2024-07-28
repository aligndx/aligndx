package main

import (
	"context"

	"github.com/aligndx/aligndx/internal/jobs"
	"github.com/aligndx/aligndx/internal/logger"
)

var log *logger.LoggerWrapper

func main() {
	ctx := context.Background()
	log = logger.NewLoggerWrapper("zerolog", ctx)
	jobs.StartWorker()
}
