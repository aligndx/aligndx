package main

import (
	"log"
	"os"
	"strings"

	_ "github.com/aligndx/aligndx/internal/migrations"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
)

func main() {
	app := pocketbase.New()

	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		// enable auto creation of migration files when making collection changes in the Admin UI
		// (the isGoRun check is to enable it only during development)
		Dir:         "./internal/migrations", // path to migration files
		Automigrate: isGoRun,
	})
	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
