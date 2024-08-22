package docker

import (
	"context"
	"fmt"
	"io"

	"github.com/aligndx/aligndx/internal/jobs/executor"
	"github.com/aligndx/aligndx/internal/logger"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
)

type DockerExecutor struct {
	client *client.Client
	log    *logger.LoggerWrapper
}

var _ executor.Executor = (*DockerExecutor)(nil)

func NewDockerExecutor(log *logger.LoggerWrapper) (*DockerExecutor, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		err := fmt.Errorf("failed to create docker client: %w", err)
		log.Error("Failed to create Docker client", map[string]interface{}{"error": err})
		return nil, err
	}
	return &DockerExecutor{client: cli, log: log}, nil
}

// Execute runs a Docker container based on the provided configuration.
func (d *DockerExecutor) Execute(ctx context.Context, config interface{}) (string, error) {
	d.log.Debug("Executing in Docker", map[string]interface{}{"config": config})

	// Type assertion to ensure the config is of type DockerConfig
	dockerConfig, ok := config.(*DockerConfig)
	if !ok {
		err := fmt.Errorf("invalid configuration type: expected DockerConfig")
		d.log.Error("Invalid configuration", map[string]interface{}{"error": err})
		return "", err
	}

	// Ensure required fields are set
	if dockerConfig.Image == "" {
		err := fmt.Errorf("Docker image must be specified")
		d.log.Error("Missing Docker image", map[string]interface{}{"error": err})
		return "", err
	}
	if len(dockerConfig.Command) == 0 {
		err := fmt.Errorf("Docker command must be specified")
		d.log.Error("Missing Docker command", map[string]interface{}{"error": err})
		return "", err
	}

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		d.log.Error("Failed to create Docker client with API version negotiation", map[string]interface{}{"error": err})
		return "", err
	}
	defer cli.Close()

	d.log.Debug("Pulling Docker Image", map[string]interface{}{"image": dockerConfig.Image})

	out, err := cli.ImagePull(ctx, dockerConfig.Image, image.PullOptions{})
	if err != nil {
		d.log.Error("Failed to pull Docker image", map[string]interface{}{"error": err, "image": dockerConfig.Image})
		return "", err
	}
	defer out.Close()

	// Suppress the logs by writing to io.Discard
	io.Copy(io.Discard, out)

	d.log.Debug("Docker image pulled successfully", map[string]interface{}{"image": dockerConfig.Image})

	// Create the container using the DockerConfig struct
	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image:      dockerConfig.Image,
		Cmd:        dockerConfig.Command,
		Env:        dockerConfig.Env,
		WorkingDir: dockerConfig.WorkingDir,
	}, &container.HostConfig{
		Binds:      dockerConfig.Volumes,
		AutoRemove: dockerConfig.AutoRemove,
	}, nil, nil, "")
	if err != nil {
		d.log.Error("Failed to create Docker container", map[string]interface{}{"error": err})
		return "", err
	}

	// Start the container
	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		d.log.Error("Failed to start Docker container", map[string]interface{}{"error": err, "containerID": resp.ID})
		return "", err
	}

	d.log.Debug("Docker container started successfully", map[string]interface{}{"containerID": resp.ID})

	return "Success", nil
}
