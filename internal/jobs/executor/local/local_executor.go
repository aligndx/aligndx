package local

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/aligndx/aligndx/internal/jobs/executor"
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
		le.log.Error("Invalid configuration", map[string]interface{}{"error": err})
		return "", err
	}

	// Ensure required fields are set
	if len(localConfig.Command) == 0 {
		err := fmt.Errorf("command must be specified")
		le.log.Error("Missing command", map[string]interface{}{"error": err})
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

	// Capture the combined output (stdout and stderr)
	output, err := cmd.CombinedOutput()
	if err != nil {
		le.log.Error("Command execution failed", map[string]interface{}{
			"error":   err,
			"command": strings.Join(localConfig.Command, " "),
			"output":  string(output),
		})
		return "", fmt.Errorf("command execution failed: %v, output: %s", err, string(output))
	}

	le.log.Debug("Command executed successfully", map[string]interface{}{"output": string(output)})

	return string(output), nil
}
