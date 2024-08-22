package executor

import (
	"context"
	"fmt"
	"io"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
)

type DockerExecutor struct {
	client *client.Client
}

var _ Executor = (*DockerExecutor)(nil)

func NewDockerExecutor() (*DockerExecutor, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		return nil, err
	}
	return &DockerExecutor{client: cli}, nil
}

// Execute runs a Docker container based on the provided configuration.
func (d *DockerExecutor) Execute(ctx context.Context, config interface{}) (string, error) {
	// Type assertion to ensure the config is of type DockerConfig
	dockerConfig, ok := config.(*DockerConfig)
	if !ok {
		return "", fmt.Errorf("invalid configuration type: expected DockerConfig")
	}

	// Ensure required fields are set
	if dockerConfig.Image == "" {
		return "", fmt.Errorf("Docker image must be specified")
	}
	if len(dockerConfig.Command) == 0 {
		return "", fmt.Errorf("Docker command must be specified")
	}

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return "", err
	}
	defer cli.Close()

	out, err := cli.ImagePull(ctx, dockerConfig.Image, image.PullOptions{})
	if err != nil {
		return "", err
	}
	defer out.Close()

	// Suppress the logs by writing to io.Discard
	io.Copy(io.Discard, out)

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
		return "", err
	}

	// Start the container
	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return "", err
	}

	return "Job started successfully", nil
}
