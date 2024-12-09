package cmd

import (
	"github.com/aligndx/aligndx/cmd/tools"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "aligndx",
	Short: "The AlignDx CLI tool",
}

func init() {
	rootCmd.AddCommand(StartCommand(rootCmd), InitCommand(), tools.ToolsCmd)
}

func Execute() error {
	return rootCmd.Execute()
}
