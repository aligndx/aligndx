package cmd

import (
	"github.com/aligndx/aligndx/internal/uiserver"
	"github.com/spf13/cobra"
)

var port string

var uiCmd = &cobra.Command{
	Use:   "ui",
	Short: "Start the UI server",
	RunE: func(cmd *cobra.Command, args []string) error {
		return uiserver.StartUIServer(port)
	},
}

func init() {
	rootCmd.AddCommand(uiCmd)
	uiCmd.Flags().StringVarP(&port, "port", "p", "3000", "Port to serve the UI on")
}
