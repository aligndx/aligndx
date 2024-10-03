package executor

import "context"

type Executor interface {
	Execute(ctx context.Context, config interface{}) (string, error)
}

// ExecutorService
type ExecutorService struct {
	executor Executor
}

func NewExecutorService(executor Executor) *ExecutorService {
	return &ExecutorService{executor: executor}
}

func (s *ExecutorService) Execute(ctx context.Context, config interface{}) (string, error) {
	return s.executor.Execute(ctx, config)
}
