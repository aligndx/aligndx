package workflow

import (
	_ "embed"
	"fmt"
	"os"
	"text/template"
)

type NFConfigParams struct {
	NatsEnabled          bool
	NatsURL              string
	NatsSubject          string
	NatsEvents           []string
	NatsJetStreamEnabled bool
}

//go:embed nextflow.config.tmpl
var nextflowConfigTemplate string

func generateConfig(nats_url string, nats_subject string) (string, error) {

	// Set up the variables for the template
	params := NFConfigParams{
		NatsEnabled:          true,
		NatsURL:              nats_url,
		NatsSubject:          nats_subject,
		NatsEvents:           []string{"workflow.start", "workflow.error", "workflow.complete", "process.start", "process.complete"},
		NatsJetStreamEnabled: false,
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
