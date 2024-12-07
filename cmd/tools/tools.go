package tools

import "github.com/spf13/cobra"

var ToolsCmd = &cobra.Command{
	Use:   "tools",
	Short: "Additional tools and server commands",
}

func init() {
	ToolsCmd.AddCommand(NewCustomServeCommand(), natsCmd, uiCmd, WorkerCommand())
}
