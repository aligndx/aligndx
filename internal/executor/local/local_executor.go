package local

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"

	"github.com/aligndx/aligndx/internal/executor"
	"github.com/aligndx/aligndx/internal/logger"
)

type LocalExecutor struct {
	log *logger.LoggerWrapper
}

var _ executor.Executor = (*LocalExecutor)(nil)

// NewLocalExecutor creates a new LocalExecutor with a logger.
func NewLocalExecutor(log *logger.LoggerWrapper) *LocalExecutor {
	return &LocalExecutor{log: log}
}

// Execute runs a local CLI command based on the provided configuration.
func (le *LocalExecutor) Execute(ctx context.Context, config interface{}) (string, error) {
	le.log.Debug("Executing locally", map[string]interface{}{"config": config})

	// Type assertion to ensure the config is of type LocalConfig
	localConfig, ok := config.(*LocalConfig)
	if !ok {
		err := fmt.Errorf("invalid configuration type: expected LocalConfig")
		le.log.Error("Invalid configuration", map[string]interface{}{"error": err.Error()})
		return "", err
	}

	// Ensure required fields are set
	if len(localConfig.Command) == 0 {
		err := fmt.Errorf("command must be specified")
		le.log.Error("Missing command", map[string]interface{}{"error": err.Error()})
		return "", err
	}

	// Prepare the command
	cmd := exec.CommandContext(ctx, localConfig.Command[0], localConfig.Command[1:]...)

	// Set environment variables if provided
	if len(localConfig.Env) > 0 {
		cmd.Env = append(os.Environ(), localConfig.Env...)
	}

	// Set the working directory if provided
	if localConfig.WorkingDir != "" {
		cmd.Dir = localConfig.WorkingDir
	}

	// Suppress the logs by setting stdout and stderr to io.Discard
	cmd.Stdout = io.Discard
	cmd.Stderr = io.Discard

	// Execute the command
	if err := cmd.Run(); err != nil {
		le.log.Error("Command execution failed", map[string]interface{}{
			"error":   err.Error(),
			"command": strings.Join(localConfig.Command, " "),
		})
		return "", fmt.Errorf("command execution failed: %v", err)
	}

	le.log.Debug("Command executed successfully")

	// Return a success message (or change this to any meaningful result as needed)
	return "Success", nil
}
