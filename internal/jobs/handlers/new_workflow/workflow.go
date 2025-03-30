package workflow

import (
	"context"
	"encoding/json"
	"fmt"
)

type WorkflowInputs struct {
	Name       string                 `json:"name"`
	Repository string                 `json:"repository"`
	Schema     map[string]interface{} `json:"schema"`
	Inputs     map[string]interface{} `json:"inputs"`
	JobID      string                 `json:"jobid"`
	UserID     string                 `json:"userid"`
}

func WorkflowHandler(ctx context.Context, inputs interface{}) error {
	var workflowInputs WorkflowInputs
	inputBytes, err := json.Marshal(inputs) // Marshal interface to JSON first
	if err != nil {
		return fmt.Errorf("failed to marshal inputs: %w", err)
	}
	if err := json.Unmarshal(inputBytes, &workflowInputs); err != nil {
		return fmt.Errorf("failed to unmarshal inputs to WorkflowInputs: %w", err)
	}
	err = runNXF()
	if err != nil {
		return fmt.Errorf("failed to execute job: %w", err)
	}
	return nil
}

func runNXF() error {
	return nil
}

func configureNXF() error {
	return nil
}
