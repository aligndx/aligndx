package tools

import (
	"context"

	"github.com/aligndx/aligndx/internal/nats"
	"github.com/spf13/cobra"
)

func NATSCommand() *cobra.Command {
	command := &cobra.Command{
		Use:   "nats",
		Short: "Start NATS server",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			return nats.StartNATSServer(ctx, true)
		},
	}
	return command
}
