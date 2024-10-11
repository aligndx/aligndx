package cmd

import (
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "aligndx",
	Short: "The AlignDx CLI tool",
}

func Execute() error {
	return rootCmd.Execute()
}
