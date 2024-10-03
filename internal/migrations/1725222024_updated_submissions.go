package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models/schema"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("pte4fn5mi541cxc")
		if err != nil {
			return err
		}

		// remove
		collection.Schema.RemoveField("wkfhej3k")

		// add
		new_events := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "onooktln",
			"name": "events",
			"type": "relation",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"collectionId": "i5fj8bq7191oxdv",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": null,
				"displayFields": null
			}
		}`), new_events); err != nil {
			return err
		}
		collection.Schema.AddField(new_events)

		// update
		edit_params := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "3ccrmnff",
			"name": "params",
			"type": "json",
			"required": true,
			"presentable": false,
			"unique": false,
			"options": {
				"maxSize": 2000000
			}
		}`), edit_params); err != nil {
			return err
		}
		collection.Schema.AddField(edit_params)

		// update
		edit_outputs := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "ivftq3ac",
			"name": "outputs",
			"type": "relation",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"collectionId": "270xb773aehpc4p",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": null,
				"displayFields": null
			}
		}`), edit_outputs); err != nil {
			return err
		}
		collection.Schema.AddField(edit_outputs)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("pte4fn5mi541cxc")
		if err != nil {
			return err
		}

		// add
		del_metadata := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "wkfhej3k",
			"name": "metadata",
			"type": "json",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"maxSize": 2000000
			}
		}`), del_metadata); err != nil {
			return err
		}
		collection.Schema.AddField(del_metadata)

		// remove
		collection.Schema.RemoveField("onooktln")

		// update
		edit_params := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "3ccrmnff",
			"name": "inputs",
			"type": "json",
			"required": true,
			"presentable": false,
			"unique": false,
			"options": {
				"maxSize": 2000000
			}
		}`), edit_params); err != nil {
			return err
		}
		collection.Schema.AddField(edit_params)

		// update
		edit_outputs := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "ivftq3ac",
			"name": "data",
			"type": "relation",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"collectionId": "270xb773aehpc4p",
				"cascadeDelete": false,
				"minSelect": null,
				"maxSelect": null,
				"displayFields": null
			}
		}`), edit_outputs); err != nil {
			return err
		}
		collection.Schema.AddField(edit_outputs)

		return dao.SaveCollection(collection)
	})
}
