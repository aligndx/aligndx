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
	// Add default pocketbase commands
	pb, err := pb.CreatePbApp(ToolsCmd)
	if err != nil {
	}

	// Add aligndx commands
	ToolsCmd.AddCommand(NewCustomServeCommand(pb), NATSCommand(), UIServeCommand(), WorkerCommand())
}
