package tools

import (
	"github.com/aligndx/aligndx/internal/pb"
	"github.com/spf13/cobra"
)

var ToolsCmd = &cobra.Command{
	Use:   "tools",
	Short: "Additional tools and server commands",
}

func init() {
	pb.CreatePbApp(ToolsCmd)
	ToolsCmd.AddCommand(NewCustomServeCommand(), NATSCommand(), UIServeCommand(), WorkerCommand())
}
