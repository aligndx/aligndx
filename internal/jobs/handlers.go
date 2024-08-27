package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"text/template"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/jobs/executor"
	"github.com/aligndx/aligndx/internal/jobs/executor/local"
	"github.com/aligndx/aligndx/internal/logger"
)

// WorkflowInputs represents the expected inputs for the WorkflowHandler.
type WorkflowInputs struct {
	JobID    string                 `json:"jobid"`
	Workflow string                 `json:"workflow"`
	Inputs   map[string]interface{} `json:"inputs"`
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
	nxfDir := fmt.Sprintf("%s/nxf", jobDir)

	config := local.NewLocalConfig(
		[]string{
			fmt.Sprintf("%s/nextflow", baseDir),
			"-log", fmt.Sprintf("%s/nextflow.logs", jobDir),
			"run", inputs.Workflow,
			"-c", configFilePath,
			// "-params-file", jsonFilePath,
			// "-profile", "docker",
			"-profile", "docker,test",
			"--nats_url", cfg.MQ.URL,
			"--outdir", fmt.Sprintf("%s/results", jobDir),
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

	defer os.RemoveAll(nxfDir)
	// Stage data back to pocketbase, then cleanup

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

type NFConfigParams struct {
	NatsEnabled          bool
	NatsURL              string
	NatsSubject          string
	NatsEvents           []string
	NatsJetStreamEnabled bool
}

func generateConfig(nats_url string, nats_subject string) (string, error) {
	currentDir, err := os.Getwd()
	if err != nil {
		fmt.Println("Error getting current directory:", err)
	}
	// Set up the variables for the template
	params := NFConfigParams{
		NatsEnabled:          true,
		NatsURL:              nats_url,
		NatsSubject:          nats_subject,
		NatsEvents:           []string{"workflow.start", "workflow.error", "workflow.complete", "process.start", "process.complete"},
		NatsJetStreamEnabled: false,
	}

	// Open the template file
	tmpl, err := template.ParseFiles(fmt.Sprintf("%s/internal/jobs/nextflow.config.tmpl", currentDir))
	if err != nil {
		return "", fmt.Errorf("error reading template file: %w", err)
	}

	// Create a temporary file
	tempFile, err := os.CreateTemp("", "nextflow-*.config")
	if err != nil {
		return "", fmt.Errorf("error creating temporary file: %w", err)
	}

	// Execute the template with the provided variables and write to the temporary file
	err = tmpl.Execute(tempFile, params)
	if err != nil {
		tempFile.Close() // Ensure the file is closed if an error occurs
		os.Remove(tempFile.Name())
		return "", fmt.Errorf("error writing to temporary file: %w", err)
	}

	// Make sure the file content is written and the file is closed
	err = tempFile.Close()
	if err != nil {
		os.Remove(tempFile.Name())
		return "", fmt.Errorf("error closing temporary file: %w", err)
	}

	// Return the path of the generated temporary config file
	return tempFile.Name(), nil
}
