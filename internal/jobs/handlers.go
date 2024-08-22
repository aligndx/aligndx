package jobs

import (
	"context"
	"fmt"

	"github.com/aligndx/aligndx/internal/jobs/executor"
	"github.com/aligndx/aligndx/internal/jobs/executor/docker"
	"github.com/aligndx/aligndx/internal/logger"
)

func WorkflowHandler(ctx context.Context, inputs map[string]interface{}) error {
	log := logger.NewLoggerWrapper("zerolog", ctx)

	// Create a Docker executor
	dockerExec, err := docker.NewDockerExecutor(log)
	if err != nil {
		return fmt.Errorf("failed to create Docker executor: %w", err)
	}
	es := executor.NewExecutorService(dockerExec)

	// Define Docker options
	dockerConfig := docker.NewDockerConfig(
		"nextflow/nextflow:latest",
		[]string{"nextflow", "run", "hello"},
	)

	// Execute the command with the Docker options
	_, err = es.Execute(ctx, dockerConfig)
	if err != nil {
		return fmt.Errorf("failed to execute job: %w", err)
	}

	return nil
}
