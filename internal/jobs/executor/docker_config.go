package executor

type DockerConfig struct {
	Image      string
	Command    []string
	Volumes    []string
	Env        []string
	WorkingDir string
	AutoRemove bool
}

// NewDockerConfig creates a DockerConfig with required fields and applies functional options.
func NewDockerConfig(image string, command []string, opts ...DockerConfigOption) *DockerConfig {
	// Set required fields
	config := &DockerConfig{
		Image:      image,
		Command:    command,
		Volumes:    []string{},
		Env:        []string{},
		WorkingDir: "/workspace",
		AutoRemove: false,
	}

	// Apply all options to the config
	for _, opt := range opts {
		opt(config)
	}

	return config
}
