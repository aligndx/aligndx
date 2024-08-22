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

type DockerOptions struct {
	Image   string
	Volumes []string
}

func NewDockerExecutor() (*DockerExecutor, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		return nil, err
	}
	return &DockerExecutor{client: cli}, nil
}

func (d *DockerExecutor) Execute(ctx context.Context, command []string, opts ...JobOption) (string, error) {
	jobDetails := JobDetails{
		Command: command,
		Options: make(map[string]interface{}),
	}

	for _, opt := range opts {
		opt(&jobDetails)
	}

	dockerOpts, ok := jobDetails.Options["docker"].(DockerOptions)
	if !ok || dockerOpts.Image == "" {
		return "", fmt.Errorf("invalid or missing Docker options")
	}

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		panic(err)
	}
	defer cli.Close()

	out, err := cli.ImagePull(ctx, dockerOpts.Image, image.PullOptions{})
	if err != nil {
		panic(err)
	}
	defer out.Close()
	io.Copy(io.Discard, out)

	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image: dockerOpts.Image,
		Cmd:   command,
	}, nil, nil, nil, "")
	if err != nil {
		panic(err)
	}

	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		panic(err)
	}

	return "", nil

}
