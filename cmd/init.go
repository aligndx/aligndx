package cmd

import (
	"github.com/aligndx/aligndx/internal/setup"
	"github.com/spf13/cobra"
)

func InitCommand() *cobra.Command {
	command := &cobra.Command{
		Use:   "init",
		Short: "Setup Aligndx",
		RunE: func(cmd *cobra.Command, args []string) error {
			return setup.Setup()
		},
	}
	return command
}
