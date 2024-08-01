package jobs

import (
	"context"
	"fmt"

	"github.com/aligndx/aligndx/internal/jobs/executor"
)

func WorkflowHandler(ctx context.Context, inputs map[string]interface{}) error {
	// Create a Docker executor
	dockerExec, err := executor.NewDockerExecutor()
	if err != nil {
		return fmt.Errorf("failed to create Docker executor: %v", err)
	}
	es := executor.NewExecutorService(dockerExec)
	command := []string{"nextflow", "run"}

	_, err = es.Execute(ctx, command)

	if err != nil {
		return fmt.Errorf("failed to execute job: %v", err)
	}

	return nil
}
