package workflow

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/logger"
	"github.com/aligndx/aligndx/internal/nextflow"
	pb "github.com/aligndx/aligndx/internal/pb/client"
)

func WorkflowHandler(ctx context.Context, inputs interface{}) error {
	log := logger.NewLoggerWrapper("zerolog", ctx)
	configManager := config.NewConfigManager()
	cfg := configManager.GetConfig()
	client := pb.NewClient(cfg.API.URL, "")
	client.SetAuthCredentials("users", cfg.API.DefaultAdminEmail, cfg.API.DefaultAdminPassword)

	_, err := client.AuthWithPassword("users", cfg.API.DefaultAdminEmail, cfg.API.DefaultAdminPassword)
	if err != nil {
		return fmt.Errorf("failed to authenticate: %w", err)
	}
	var workflowInputs nextflow.NextflowInputs
	inputBytes, err := json.Marshal(inputs) // Marshal interface to JSON first
	if err != nil {
		return fmt.Errorf("failed to marshal inputs: %w", err)
	}
	if err := json.Unmarshal(inputBytes, &workflowInputs); err != nil {
		return fmt.Errorf("failed to unmarshal inputs to WorkflowInputs: %w", err)
	}

	log.Debug("Starting nextflow.Run")
	err = nextflow.Run(ctx, client, log, cfg, workflowInputs)
	if err != nil {
		return fmt.Errorf("failed to execute job: %w", err)
	}
	log.Debug("Finished nextflow.Run")

	return nil
}
