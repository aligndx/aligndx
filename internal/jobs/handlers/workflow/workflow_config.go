package workflow

import (
	_ "embed"
	"fmt"
	"os"
	"runtime"
	"text/template"

	"github.com/shirou/gopsutil/v3/mem"
)

type NFConfigParams struct {
	NatsEnabled          bool
	NatsURL              string
	NatsSubject          string
	NatsEvents           []string
	NatsJetStreamEnabled bool
	MaxCPUs              int
	MaxMemory            string
}

//go:embed nextflow.config.tmpl
var nextflowConfigTemplate string

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

func generateConfig(nats_url string, nats_subject string) (string, error) {
	numCPUs, availableMemory, err := getSystemResources()
	if err != nil {
		return "", err
	}

	// Set up the variables for the template
	params := NFConfigParams{
		NatsEnabled:          true,
		NatsURL:              nats_url,
		NatsSubject:          nats_subject,
		NatsEvents:           []string{"workflow.start", "workflow.error", "workflow.complete", "process.start", "process.complete"},
		NatsJetStreamEnabled: false,
		MaxCPUs:              numCPUs,
		MaxMemory:            availableMemory,
	}

	// Step 2: Parse the embedded template
	tmpl, err := template.New("nextflowConfig").Parse(nextflowConfigTemplate)
	if err != nil {
		return "", fmt.Errorf("error parsing embedded template: %w", err)
	}

	// Create a temporary file
	tempFile, err := os.CreateTemp("", "nextflow-*.config")
	if err != nil {
		return "", fmt.Errorf("error creating temporary file: %w", err)
	}

	// Step 3: Execute the template with the provided variables and write to the temporary file
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
