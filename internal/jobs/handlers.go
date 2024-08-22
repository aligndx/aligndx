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

	// Define Docker options
	dockerOptions := executor.DockerOptions{
		Image: "nextflow/nextflow",
		Volumes: []string{
			"/host/data:/container/data",
		},
	}

	// Create a JobOption to pass the DockerOptions
	dockerOption := func(details *executor.JobDetails) {
		details.Options["docker"] = dockerOptions
	}

	// Define the command to execute
	command := []string{"nextflow", "run", "hello"}

	// Execute the command with the Docker options
	_, err = es.Execute(ctx, command, dockerOption)
	if err != nil {
		return fmt.Errorf("failed to execute job: %v", err)
	}

	return nil
}
