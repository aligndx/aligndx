package local

type LocalConfig struct {
	Command    []string
	Env        []string
	WorkingDir string
}

// NewLocalConfig creates a LocalConfig with required fields and applies functional options.
func NewLocalConfig(command []string, opts ...LocalConfigOption) *LocalConfig {
	// Set required fields
	config := &LocalConfig{
		Command:    command,
		Env:        []string{},
		WorkingDir: "",
	}

	// Apply all options to the config
	for _, opt := range opts {
		opt(config)
	}

	return config
}

// LocalConfigOption defines a function signature for modifying LocalConfig.
type LocalConfigOption func(*LocalConfig)

// WithEnv sets environment variables for the command.
func WithEnv(env []string) LocalConfigOption {
	return func(config *LocalConfig) {
		config.Env = env
	}
}

// WithWorkingDir sets the working directory for the command.
func WithWorkingDir(workingDir string) LocalConfigOption {
	return func(config *LocalConfig) {
		config.WorkingDir = workingDir
	}
}
