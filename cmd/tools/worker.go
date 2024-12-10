package tools

import (
	"context"

	"github.com/aligndx/aligndx/internal/jobs"
	"github.com/spf13/cobra"
)

func WorkerCommand() *cobra.Command {
	command := &cobra.Command{
		Use:   "worker",
		Short: "Starts a worker",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()

			return jobs.StartWorker(ctx, cancel)
		},
	}

	return command
}
