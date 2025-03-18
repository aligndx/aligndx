package migrations

import (
	"encoding/json"
	// For Go 1.16+ embed support.
	_ "embed"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

//go:embed default_workflow.json
var dataJson []byte

type WorkflowData struct {
	Name        string                 `json:"name"`
	Repository  string                 `json:"repository"`
	Description string                 `json:"description"`
	Schema      map[string]interface{} `json:"schema"` // Updated to a map for JSON object
}

func init() {
	m.Register(func(app core.App) error {
		workflows, err := app.FindCollectionByNameOrId("workflows")
		if err != nil {
			return err
		}

		var data WorkflowData
		if err := json.Unmarshal(dataJson, &data); err != nil {
			return err
		}

		record := core.NewRecord(workflows)
		record.Set("name", data.Name)
		record.Set("repository", data.Repository)
		record.Set("description", data.Description)
		record.Set("schema", data.Schema)

		return app.Save(record)
	}, func(app core.App) error {
		var data WorkflowData
		if err := json.Unmarshal(dataJson, &data); err != nil {
			return err
		}
		// Note: fixed typo "worfklows" to "workflows"
		record, _ := app.FindFirstRecordByData("workflows", "name", data.Name)
		if record == nil {
			return nil // probably already deleted
		}
		return app.Delete(record)
	})
}
