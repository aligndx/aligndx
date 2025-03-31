package nextflow

import (
	_ "embed"
	"fmt"
	"html/template"
	"os"
	"runtime"

	"github.com/shirou/gopsutil/v3/mem"
)

//go:embed templates/nextflow.config.tmpl
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
