package workflow

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/jobs/executor"
	"github.com/aligndx/aligndx/internal/jobs/executor/local"
	"github.com/aligndx/aligndx/internal/logger"
)

// WorkflowInputs represents the expected inputs for the WorkflowHandler.
type WorkflowInputs struct {
	Name     string                 `json:"name"`
	Workflow string                 `json:"workflow"`
	Inputs   map[string]interface{} `json:"inputs"`
	JobID    string                 `json:"jobid"`
	UserID   string                 `json:"userid"`
}

// WorkflowHandlerSpecific contains specific job logic
func WorkflowHandlerSpecific(ctx context.Context, inputs WorkflowInputs) error {
	log := logger.NewLoggerWrapper("zerolog", ctx)
	configService := config.NewConfigService(log)
	cfg := configService.LoadConfig()

	currentDir, err := os.Getwd()
	if err != nil {
		fmt.Println("Error getting current directory:", err)
	}

	configFilePath, err := generateConfig(cfg.MQ.URL, fmt.Sprintf("jobs.%s", inputs.JobID))
	if err != nil {
		return fmt.Errorf("failed to generate nextflow config file: %w", err)
	}
	defer os.Remove(configFilePath)

	jsonFilePath, err := prepareJSONFile(inputs.Inputs)
	if err != nil {
		return fmt.Errorf("failed to prepare JSON file: %w", err)
	}
	defer os.Remove(jsonFilePath)

	localExec := local.NewLocalExecutor(log)
	es := executor.NewExecutorService(localExec)

	baseDir := fmt.Sprintf("%s/pb_data/workflows", currentDir)
	jobDir := fmt.Sprintf("%s/pb_data/workflows/%s", currentDir, inputs.JobID)

	// Defer the cleanup immediately after jobDir creation
	defer os.RemoveAll(jobDir)

	nxfDir := fmt.Sprintf("%s/nxf", jobDir)
	resultsdir := fmt.Sprintf("%s/%s_results", jobDir, inputs.Name)

	config := local.NewLocalConfig(
		[]string{
			fmt.Sprintf("%s/nextflow", baseDir),
			"-log", fmt.Sprintf("%s/nextflow.log", jobDir),
			"run", inputs.Workflow,
			"-c", configFilePath,
			// "-params-file", jsonFilePath,
			// "-profile", "docker",
			"-profile", "docker,test",
			"--nats_url", cfg.MQ.URL,
			"--outdir", resultsdir,
		},
		local.WithWorkingDir(baseDir),
		local.WithEnv([]string{
			fmt.Sprintf("NXF_HOME=%s", nxfDir),
			fmt.Sprintf("NXF_ASSETS=%s/assets", baseDir),
			fmt.Sprintf("NXF_PLUGINS_DIR=%s/plugins", baseDir),
			fmt.Sprintf("NXF_WORK=%s/work", nxfDir),
			fmt.Sprintf("NXF_TEMP=%s/tmp", nxfDir),
			fmt.Sprintf("NXF_CACHE_DIR=%s/cache", nxfDir),
		}),
	)

	_, err = es.Execute(ctx, config)
	if err != nil {
		return fmt.Errorf("failed to execute job: %w", err)
	}

	StoreResults(cfg, inputs.UserID, inputs.JobID, resultsdir)

	return nil
}

// WorkflowHandler is the entry point handler for workflow jobs.
func WorkflowHandler(ctx context.Context, inputs interface{}) error {
	// Assert inputs to be the correct type
	var workflowInputs WorkflowInputs
	inputBytes, err := json.Marshal(inputs) // Marshal interface to JSON first
	if err != nil {
		return fmt.Errorf("failed to marshal inputs: %w", err)
	}

	if err := json.Unmarshal(inputBytes, &workflowInputs); err != nil {
		return fmt.Errorf("failed to unmarshal inputs to WorkflowInputs: %w", err)
	}

	return WorkflowHandlerSpecific(ctx, workflowInputs)
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
