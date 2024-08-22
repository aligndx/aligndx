package docker

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
