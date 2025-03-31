package nextflow

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

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
	paths, err := prepareWorkingDirectories(inputs.JobID, inputs.Name)
	if err != nil {
		return err
	}
	defer os.RemoveAll(paths.JobDir)

	configPath, err := generateNXFConfig()
	if err != nil {
		return fmt.Errorf("failed to generate config: %w", err)
	}
	defer os.Remove(configPath)

	inputsPath, err := prepareInputsJSON(client, inputs.Inputs, inputs.Schema, paths.JobDir)

	if err != nil {
		return fmt.Errorf("failed to prepare inputs: %w", err)
	}
	defer os.Remove(inputsPath)

	execCfg := prepareNXFEnv(cfg, paths, configPath, inputsPath, inputs)

	localExec := local.NewLocalExecutor(log)
	es := executor.NewExecutorService(localExec)
	if _, err := es.Execute(ctx, execCfg); err != nil {
		return fmt.Errorf("workflow execution failed: %w", err)
	}
	StoreResults(client, cfg, inputs.UserID, inputs.JobID, paths.ResultsDir)
	return nil
}

func prepareWorkingDirectories(jobID, name string) (*WorkflowPaths, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return nil, fmt.Errorf("failed to get current working directory: %w", err)
	}

	baseDir := filepath.Join(cwd, "pb_data", "workflows")
	jobDir := filepath.Join(baseDir, jobID)
	inputsDir := filepath.Join(jobDir, "inputs")
	nxfDir := filepath.Join(jobDir, "nxf")
	logPath := filepath.Join(baseDir, "logs", fmt.Sprintf("%s.nextflow.log", jobID))
	resultsDir := filepath.Join(jobDir, fmt.Sprintf("%s_results", name))

	dirs := []string{baseDir, jobDir, inputsDir}
	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0777); err != nil {
			return nil, fmt.Errorf("failed to create directory %s: %w", dir, err)
		}
	}

	return &WorkflowPaths{
		BaseDir:    baseDir,
		JobDir:     jobDir,
		InputsDir:  inputsDir,
		NXFDir:     nxfDir,
		LogPath:    logPath,
		ResultsDir: resultsDir,
	}, nil
}

func prepareNXFEnv(cfg *config.Config, paths *WorkflowPaths, configPath, inputsPath string, inputs NextflowInputs) *local.LocalConfig {
	return local.NewLocalConfig(
		[]string{
			"nextflow",
			"-log", paths.LogPath,
			"run", inputs.Repository,
			"-latest",
			"-c", configPath,
			"-params-file", inputsPath,
			"--outdir", paths.ResultsDir,
		},
		local.WithWorkingDir(paths.BaseDir),
		local.WithEnv([]string{
			"NXF_HOME=" + paths.NXFDir,
			"NXF_ASSETS=" + filepath.Join(paths.BaseDir, "assets"),
			"NXF_PLUGINS_DIR=" + filepath.Join(paths.BaseDir, "plugins"),
			"NXF_WORK=" + filepath.Join(paths.NXFDir, "work"),
			"NXF_TEMP=" + filepath.Join(paths.NXFDir, "tmp"),
			"NXF_CACHE_DIR=" + filepath.Join(paths.NXFDir, "cache"),
			"NXF_PLUGINS_TEST_REPOSITORY=" + cfg.NXF.PluginsTestRepository,
		}),
	)
}
