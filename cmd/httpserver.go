package cmd

import (
	"context"

	"github.com/aligndx/aligndx/internal/httpserver"
	"github.com/spf13/cobra"
)

func NewCustomServeCommand() *cobra.Command {
	command := &cobra.Command{
		Use:   "serve",
		Short: "Initialize aligndx server",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			return httpserver.StartHTTPServer(ctx, rootCmd)
		},
	}

	return command
}

func init() {
	// Add your custom serve command to the rootCmd
	rootCmd.AddCommand(NewCustomServeCommand())
}
