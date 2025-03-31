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

	log.Debug("Executing NXF")

	localExec := local.NewLocalExecutor(log)
	es := executor.NewExecutorService(localExec)
	if _, err := es.Execute(ctx, execCfg); err != nil {
		return fmt.Errorf("workflow execution failed: %w", err)
	}

	log.Debug("Storing Results")
	StoreResults(client, cfg, inputs.UserID, inputs.JobID, paths.ResultsDir)
	return nil
}
