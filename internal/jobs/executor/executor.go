package executor

import "context"

type JobDetails struct {
	Command []string
	Options map[string]interface{}
}
type JobOption func(*JobDetails)

type Executor interface {
	Execute(ctx context.Context, command []string, opts ...JobOption) (string, error)
}

type ExecutorService struct {
	executor Executor
}

func NewExecutorService(executor Executor) *ExecutorService {
	return &ExecutorService{executor: executor}
}

func (s *ExecutorService) Execute(ctx context.Context, command []string, opts ...JobOption) (string, error) {
	return s.executor.Execute(ctx, command, opts...)
}
