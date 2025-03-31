package workflow

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/logger"
	pb "github.com/aligndx/aligndx/internal/pb/client"
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
	log := logger.NewLoggerWrapper("zerolog", ctx)
	configManager := config.NewConfigManager()
	cfg := configManager.GetConfig()

	var workflowInputs WorkflowInputs
	inputBytes, err := json.Marshal(inputs) // Marshal interface to JSON first
	if err != nil {
		return fmt.Errorf("failed to marshal inputs: %w", err)
	}
	if err := json.Unmarshal(inputBytes, &workflowInputs); err != nil {
		return fmt.Errorf("failed to unmarshal inputs to WorkflowInputs: %w", err)
	}

	client := pb.NewClient(cfg.API.URL, "")
	client.SetAuthCredentials("users", cfg.API.DefaultAdminEmail, cfg.API.DefaultAdminPassword)

	err = runNXF(ctx, client, log, cfg, workflowInputs)
	if err != nil {
		return fmt.Errorf("failed to execute job: %w", err)
	}
	return nil
}
