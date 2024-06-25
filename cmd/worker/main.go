package main

import (
	"context"

	"github.com/aligndx/aligndx/internal/jobs"
	"github.com/aligndx/aligndx/internal/logger"
)

var log *logger.LoggerWrapper

func init() {
	ctx := context.Background()
	log = logger.NewLoggerWrapper("zerolog", ctx)
}

func main() {
	jobs.StartWorker()
}
