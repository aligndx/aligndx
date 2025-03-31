package workflow

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/jobs/executor"
	"github.com/aligndx/aligndx/internal/jobs/executor/local"
	"github.com/aligndx/aligndx/internal/logger"
	pb "github.com/aligndx/aligndx/internal/pb/client"
	"github.com/shirou/gopsutil/v3/mem"
)

func runNXF(ctx context.Context, client *pb.Client, log *logger.LoggerWrapper, cfg *config.Config, inputs WorkflowInputs) error {

	// Start by getting the working directory
	currentDir, err := os.Getwd()
	if err != nil {
		fmt.Println("error getting current directory:", err)
	}

	// Generate the nextflow config with execution configurations
	configFilePath, err := generateNXFConfig()
	if err != nil {
		return fmt.Errorf("failed to generate nextflow config file: %w", err)
	}
	defer os.Remove(configFilePath)

	// Setup head job executor
	localExec := local.NewLocalExecutor(log)
	es := executor.NewExecutorService(localExec)

	baseDir := fmt.Sprintf("%s/pb_data/workflows", currentDir)
	jobDir := fmt.Sprintf("%s/pb_data/workflows/%s", currentDir, inputs.JobID)
	logPath := fmt.Sprintf("%s/pb_data/workflows/logs/%s.nextflow.log", currentDir, inputs.JobID)
	inputsDir := fmt.Sprintf("%s/inputs", jobDir)

	os.MkdirAll(baseDir, 0777)
	os.MkdirAll(jobDir, 0777)
	os.MkdirAll(inputsDir, 0777)

	// Generate inputs json file
	jsonFilePath, err := generateNXFInputsJSONFile(client, cfg, inputs.Inputs, inputs.Schema, inputsDir)
	if err != nil {
		return fmt.Errorf("failed to prepare JSON file: %w", err)
	}
	defer os.Remove(jsonFilePath)

	// Defer the cleanup immediately after jobDir creation
	defer os.RemoveAll(jobDir)

	nxfDir := fmt.Sprintf("%s/nxf", jobDir)
	resultsdir := fmt.Sprintf("%s/%s_results", jobDir, inputs.Name)

	config := local.NewLocalConfig(
		[]string{
			fmt.Sprintf("%s/nextflow", baseDir),
			"-log", logPath,
			"run", inputs.Repository,
			"-latest", // Ensure the latest code is pulled
			"-c", configFilePath,
			"-params-file", jsonFilePath,
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
			fmt.Sprintf("NXF_PLUGINS_TEST_REPOSITORY=%s", cfg.NXF.PluginsTestRepository),
		}),
	)

	_, err = es.Execute(ctx, config)
	if err != nil {
		return fmt.Errorf("failed to execute job: %w", err)
	}

	StoreResults(client, cfg, inputs.UserID, inputs.JobID, resultsdir)
	return nil
}

func getSystemResources() (int, string, error) {
	// Get total logical CPUs
	numCPUs := runtime.NumCPU()

	// Get available memory in GB
	memStats, err := mem.VirtualMemory()
	if err != nil {
		return 0, "", fmt.Errorf("failed to get memory stats: %w", err)
	}
	availableMemoryGB := memStats.Available / (1024 * 1024 * 1024) // Convert to GB

	return numCPUs, fmt.Sprintf("%d.GB", availableMemoryGB), nil
}

//go:embed nextflow.config.tmpl
var nextflowConfigTemplate string

type NFConfigParams struct {
	MaxCPUs   int
	MaxMemory string
}

func generateNXFConfig() (string, error) {
	numCPUs, availableMemory, err := getSystemResources()
	if err != nil {
		return "", err
	}

	// Set up the variables for the template
	params := NFConfigParams{
		MaxCPUs:   numCPUs,
		MaxMemory: availableMemory,
	}

	// Parse the embedded template
	tmpl, err := template.New("nextflowConfig").Parse(nextflowConfigTemplate)
	if err != nil {
		return "", fmt.Errorf("error parsing embedded template: %w", err)
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

	return tempFile.Name(), nil

}

func generateNXFInputsJSONFile(client *pb.Client, cfg *config.Config, inputs map[string]interface{}, schema map[string]interface{}, jobDir string) (string, error) {
	for key, input := range inputs {
		if !isFileInput(key, schema) {
			continue
		}

		fileIDs, ok := input.([]interface{})
		if !ok {
			return "", fmt.Errorf("input for %s must be an array of file IDs", key)
		}

		inputDir := filepath.Join(jobDir, key)
		if err := os.MkdirAll(inputDir, os.ModePerm); err != nil {
			return "", fmt.Errorf("failed to create dir for input %s: %w", key, err)
		}

		for _, idRaw := range fileIDs {
			fileID, ok := idRaw.(string)
			if !ok {
				return "", fmt.Errorf("file ID in input %s is not a string", key)
			}

			record, err := client.ViewRecord("data", fileID, nil)
			if err != nil {
				return "", fmt.Errorf("failed to fetch record %s: %w", fileID, err)
			}

			fileName, ok := record["file"].(string)
			if !ok || fileName == "" {
				return "", fmt.Errorf("missing file name in record %s", fileID)
			}

			// Download file to inputDir
			destPath := filepath.Join(inputDir, sanitizeFileName(fileName))
			opts := map[string]string{"token": "true"}
			if err := client.DownloadFile("data", fileID, fileName, destPath, opts); err != nil {
				return "", fmt.Errorf("failed to download file %s: %w", fileName, err)
			}
		}

		// Replace file ID list with local directory path
		inputs[key] = inputDir
	}

	// Save to JSON
	inputsJSON, err := json.Marshal(inputs)
	if err != nil {
		return "", fmt.Errorf("failed to marshal inputs: %w", err)
	}

	tmpfile, err := os.CreateTemp("", "aligndx_nf_params_*.json")
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	defer tmpfile.Close()

	if _, err := tmpfile.Write(inputsJSON); err != nil {
		return "", fmt.Errorf("failed to write JSON: %w", err)
	}

	return tmpfile.Name(), nil
}

func isFileInput(key string, schema map[string]interface{}) bool {
	properties, ok := schema["properties"].(map[string]interface{})
	if !ok {
		return false
	}

	fieldSchema, ok := properties[key].(map[string]interface{})
	if !ok {
		return false
	}

	format, hasFormat := fieldSchema["format"].(string)
	return hasFormat && format == "file-path"
}

func sanitizeFileName(fileName string) string {
	return strings.ReplaceAll(fileName, " ", "_")
}
