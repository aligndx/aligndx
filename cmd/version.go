package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

// Version will be injected by GoReleaser during build time
var version = "dev"

func VersionCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Print the version of AlignDx",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("AlignDx version: %s\n", version)
		},
	}
}
