package main

import (
	"log"
	"os"
	"strings"

	_ "github.com/aligndx/aligndx/internal/migrations"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
)

func main() {
	app := pocketbase.New()

	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	app.OnRecordAfterCreateRequest("submissions").Add(func(e *core.RecordCreateEvent) error {
		// Extract the submission inputs
		// Submit a background job
		// log.Println(e.HttpContext)
		// log.Println(e.Record)
		// log.Println(e.UploadedFiles)
		return nil
	})

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
