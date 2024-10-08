package docker

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
		AutoRemove: true,
	}

	// Apply all options to the config
	for _, opt := range opts {
		opt(config)
	}

	return config
}

type DockerConfigOption func(*DockerConfig)

func WithVolumes(volumes []string) DockerConfigOption {
	return func(config *DockerConfig) {
		config.Volumes = volumes
	}
}

func WithEnv(env []string) DockerConfigOption {
	return func(config *DockerConfig) {
		config.Env = env
	}
}

func WithWorkingDir(workingDir string) DockerConfigOption {
	return func(config *DockerConfig) {
		config.WorkingDir = workingDir
	}
}

func WithAutoRemove(autoRemove bool) DockerConfigOption {
	return func(config *DockerConfig) {
		config.AutoRemove = autoRemove
	}
}
