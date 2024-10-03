package workflow

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"text/template"
)

type NFConfigParams struct {
	NatsEnabled          bool
	NatsURL              string
	NatsSubject          string
	NatsEvents           []string
	NatsJetStreamEnabled bool
}

func generateConfig(nats_url string, nats_subject string) (string, error) {
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		return "", fmt.Errorf("unable to get the file path")
	}
	currentDir := filepath.Dir(filename)

	// Set up the variables for the template
	params := NFConfigParams{
		NatsEnabled:          true,
		NatsURL:              nats_url,
		NatsSubject:          nats_subject,
		NatsEvents:           []string{"workflow.start", "workflow.error", "workflow.complete", "process.start", "process.complete"},
		NatsJetStreamEnabled: false,
	}

	// Open the template file
	tmpl, err := template.ParseFiles(fmt.Sprintf("%s/nextflow.config.tmpl", currentDir))
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
