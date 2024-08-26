package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aligndx/aligndx/internal/jobs/executor"
	"github.com/aligndx/aligndx/internal/jobs/executor/docker"
	"github.com/aligndx/aligndx/internal/logger"
)

func WorkflowHandler(ctx context.Context, inputs map[string]interface{}) error {
	log := logger.NewLoggerWrapper("zerolog", ctx)

	jsonFilePath, err := prepareJSONFile(inputs)
	if err != nil {
		return fmt.Errorf("failed to prepare JSON file: %w", err)
	}
	// Ensure the temporary file is cleaned up after use
	defer os.Remove(jsonFilePath)

	// Create a Docker executor
	dockerExec, err := docker.NewDockerExecutor(log)
	if err != nil {
		return fmt.Errorf("failed to create Docker executor: %w", err)
	}
	es := executor.NewExecutorService(dockerExec)

	// Define Docker options
	dockerConfig := docker.NewDockerConfig(
		"nextflow/nextflow:latest",
		[]string{"nextflow", "run", "./main.nf", "-params-file", "/workspace/params.json"},
		docker.WithVolumes([]string{fmt.Sprintf("%s:/workspace/params.json", jsonFilePath)}),
	)

	// Execute the command with the Docker options
	_, err = es.Execute(ctx, dockerConfig)
	if err != nil {
		return fmt.Errorf("failed to execute job: %w", err)
	}

	return nil
}

func prepareJSONFile(inputs map[string]interface{}) (string, error) {
	// Convert inputs to JSON
	inputsJSON, err := json.Marshal(inputs)
	if err != nil {
		return "", fmt.Errorf("failed to marshal inputs to JSON: %w", err)
	}

	// Create a temporary file to save the JSON
	tmpfile, err := os.CreateTemp("", "aligndx_nf_params_*.json")
	if err != nil {
		return "", fmt.Errorf("failed to create temporary file: %w", err)
	}

	// Write JSON to the temporary file
	if _, err := tmpfile.Write(inputsJSON); err != nil {
		tmpfile.Close() // Close the file before returning error
		return "", fmt.Errorf("failed to write JSON to temporary file: %w", err)
	}
	if err := tmpfile.Close(); err != nil {
		return "", fmt.Errorf("failed to close temporary file: %w", err)
	}

	// Return the path of the temporary JSON file
	return tmpfile.Name(), nil
}
