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

func (le *LocalExecutor) ExecuteWithLogs(ctx context.Context, config interface{}) (<-chan string, error) {
	// Create a channel for streaming log lines.
	logChan := make(chan string)

	localConfig, ok := config.(*LocalConfig)
	if !ok {
		return nil, fmt.Errorf("invalid configuration type: expected LocalConfig")
	}

	if len(localConfig.Command) == 0 {
		return nil, fmt.Errorf("command must be specified")
	}

	// Prepare the command.
	cmd := exec.CommandContext(ctx, localConfig.Command[0], localConfig.Command[1:]...)
	if len(localConfig.Env) > 0 {
		cmd.Env = append(os.Environ(), localConfig.Env...)
	}
	if localConfig.WorkingDir != "" {
		cmd.Dir = localConfig.WorkingDir
	}

	// Create pipes for stdout and stderr.
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to get stdout pipe: %w", err)
	}
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to get stderr pipe: %w", err)
	}

	// Start the command.
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start command: %w", err)
	}

	// Function to stream log lines from an io.Reader.
	streamLogs := func(reader io.ReadCloser) {
		defer reader.Close()
		buf := make([]byte, 1024)
		for {
			n, err := reader.Read(buf)
			if n > 0 {
				// Send each log chunk as a string to the channel.
				logChan <- string(buf[:n])
			}
			if err != nil {
				if err != io.EOF {
					le.log.Error("error reading log output", map[string]interface{}{"error": err.Error()})
				}
				break
			}
		}
	}

	// Stream stdout and stderr concurrently.
	go streamLogs(stdoutPipe)
	go streamLogs(stderrPipe)

	// Wait for the command to complete and then close the channel.
	go func() {
		if err := cmd.Wait(); err != nil {
			le.log.Error("command execution failed", map[string]interface{}{
				"error":   err.Error(),
				"command": localConfig.Command,
			})
			// Optionally, you could send a final error message on logChan here.
			logChan <- fmt.Sprintf("command execution failed: %v", err)
		} else {
			le.log.Debug("command executed successfully")
			logChan <- "command executed successfully"
		}
		close(logChan)
	}()

	return logChan, nil
}
