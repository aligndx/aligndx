package tools

import (
	"context"

	"github.com/aligndx/aligndx/internal/pb"
	"github.com/pocketbase/pocketbase"
	"github.com/spf13/cobra"
)

func NewCustomServeCommand(pocketbase *pocketbase.PocketBase) *cobra.Command {
	var allowedOrigins []string
	var httpAddr string
	var httpsAddr string

	command := &cobra.Command{
		Use:   "serve",
		Short: "Initialize aligndx server",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()
			return pb.StartPBServer(ctx, pocketbase, args, allowedOrigins, httpAddr, httpsAddr, true)
		},
	}

	command.PersistentFlags().StringSliceVar(
		&allowedOrigins,
		"origins",
		[]string{"*"},
		"CORS allowed domain origins list",
	)

	command.PersistentFlags().StringVar(
		&httpAddr,
		"http",
		"",
		"TCP address to listen for the HTTP server\n(if domain args are specified - default to 0.0.0.0:80, otherwise - default to 127.0.0.1:8090)",
	)

	command.PersistentFlags().StringVar(
		&httpsAddr,
		"https",
		"",
		"TCP address to listen for the HTTPS server\n(if domain args are specified - default to 0.0.0.0:443, otherwise - default to empty string, aka. no TLS)\nThe incoming HTTP traffic also will be auto redirected to the HTTPS version",
	)

	return command
}
