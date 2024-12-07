package tools

import (
	"github.com/aligndx/aligndx/internal/uiserver"
	"github.com/spf13/cobra"
)

func UIServeCommand() *cobra.Command {
	var port string

	command := &cobra.Command{
		Use:   "ui",
		Short: "Start the UI server",
		RunE: func(cmd *cobra.Command, args []string) error {
			return uiserver.StartUIServer(port)
		},
	}

	command.Flags().StringVarP(&port, "port", "p", "3000", "Port to serve the UI on")
	return command
}
