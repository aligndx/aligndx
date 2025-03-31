package executor

import (
	"context"
	"fmt"
)

// Executor defines a basic executor interface.
type Executor interface {
	Execute(ctx context.Context, config interface{}) (string, error)
}

// ExecutorWithLogs extends Executor to include log streaming.
type ExecutorWithLogs interface {
	ExecuteWithLogs(ctx context.Context, config interface{}) (<-chan string, error)
}

// ExecutorService is a wrapper around an Executor.
type ExecutorService struct {
	executor Executor
}

// NewExecutorService creates a new ExecutorService instance.
func NewExecutorService(executor Executor) *ExecutorService {
	return &ExecutorService{executor: executor}
}

// Execute delegates the execution to the underlying executor.
func (s *ExecutorService) Execute(ctx context.Context, config interface{}) (string, error) {
	return s.executor.Execute(ctx, config)
}

// ExecuteWithLogs streams logs from the underlying executor if it supports it.
func (s *ExecutorService) ExecuteWithLogs(ctx context.Context, config interface{}) (<-chan string, error) {
	// Assert that the underlying executor supports ExecuteWithLogs.
	execWithLogs, ok := s.executor.(ExecutorWithLogs)
	if !ok {
		return nil, fmt.Errorf("underlying executor does not support ExecuteWithLogs")
	}
	return execWithLogs.ExecuteWithLogs(ctx, config)
}
