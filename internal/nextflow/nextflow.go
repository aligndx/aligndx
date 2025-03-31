package nextflow

import (
	"context"
	"fmt"
	"os"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/executor"
	"github.com/aligndx/aligndx/internal/executor/local"
	"github.com/aligndx/aligndx/internal/logger"
	pb "github.com/aligndx/aligndx/internal/pb/client"
)

type NextflowInputs struct {
	Name       string                 `json:"name"`
	Repository string                 `json:"repository"`
	Schema     map[string]interface{} `json:"schema"`
	Inputs     map[string]interface{} `json:"inputs"`
	UserID     string                 `json:"userid"`
	JobID      string                 `json:"jobid"`
}

type WorkflowPaths struct {
	BaseDir    string
	JobDir     string
	InputsDir  string
	NXFDir     string
	LogPath    string
	ResultsDir string
}

func Run(ctx context.Context, client *pb.Client, log *logger.LoggerWrapper, cfg *config.Config, inputs NextflowInputs) error {
	log.Debug("Preparing working directories")
	paths, err := prepareWorkingDirectories(inputs.JobID, inputs.Name)
	if err != nil {
		return fmt.Errorf("failed to generate directories: %w", err)
	}
	defer os.RemoveAll(paths.JobDir)

	log.Debug("Generating config")
	configPath, err := generateNXFConfig()
	if err != nil {
		return fmt.Errorf("failed to generate config: %w", err)
	}
	defer os.Remove(configPath)

	log.Debug("Preparing inputs")
	inputsPath, err := prepareInputsJSON(client, inputs.Inputs, inputs.Schema, paths.JobDir)
	if err != nil {
		return fmt.Errorf("failed to prepare inputs: %w", err)
	}
	defer os.Remove(inputsPath)

	log.Debug("Preparing NXF env")
	execCfg := prepareNXFEnv(cfg, paths, configPath, inputsPath, inputs)

	log.Debug("Executing NXF with logs")

	localExec := local.NewLocalExecutor(log)
	es := executor.NewExecutorService(localExec)

	// Use ExecuteWithLogs to obtain a log channel.
	logChan, err := es.ExecuteWithLogs(ctx, execCfg)
	if err != nil {
		return fmt.Errorf("workflow execution with logs failed: %w", err)
	}

	// Pass the log channel off to the parent by, for example,
	// sending it over a higher-level channel, or by calling a callback.
	// For demonstration, we'll simply spawn a goroutine to process the logs.
	go func() {
		for logLine := range logChan {
			// Here the parent can process the log line,
			// such as forwarding it to NATS or printing it to a UI.
			log.Debug("NXF log: " + logLine)
		}
	}()

	// Optionally, if you need to wait for the command to finish,
	// you could block until the log channel is closed.
	// For now, we'll assume the parent handles that.

	log.Debug("Storing Results")
	StoreResults(client, cfg, inputs.UserID, inputs.JobID, paths.ResultsDir)
	return nil
}

func RunWithLogs(ctx context.Context, client *pb.Client, log *logger.LoggerWrapper, cfg *config.Config, inputs NextflowInputs) (<-chan string, error) {
	log.Debug("Preparing working directories")
	paths, err := prepareWorkingDirectories(inputs.JobID, inputs.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to generate directories: %w", err)
	}

	log.Debug("Generating config")
	configPath, err := generateNXFConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to generate config: %w", err)
	}

	log.Debug("Preparing inputs")
	inputsPath, err := prepareInputsJSON(client, inputs.Inputs, inputs.Schema, paths.JobDir)
	if err != nil {
		return nil, fmt.Errorf("failed to prepare inputs: %w", err)
	}

	log.Debug("Preparing NXF env")
	execCfg := prepareNXFEnv(cfg, paths, configPath, inputsPath, inputs)

	log.Debug("Executing NXF with logs")
	localExec := local.NewLocalExecutor(log)
	es := executor.NewExecutorService(localExec)
	logChan, err := es.ExecuteWithLogs(ctx, execCfg)
	if err != nil {
		return nil, fmt.Errorf("workflow execution with logs failed: %w", err)
	}

	go func() {
		// If you want to store results only after all logs are streamed, you can block on reading.
		for range logChan {
			// Simply drain the channel if no processing is needed here.
		}
		os.Remove(inputsPath)
		os.Remove(configPath)
		os.RemoveAll(paths.JobDir)
		log.Debug("Storing Results")
		StoreResults(client, cfg, inputs.UserID, inputs.JobID, paths.ResultsDir)
	}()

	return logChan, nil
}
