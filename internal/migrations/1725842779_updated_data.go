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

		collection, err := dao.FindCollectionByNameOrId("270xb773aehpc4p")
		if err != nil {
			return err
		}

		// add
		new_submission := &schema.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "4qnscuph",
			"name": "submission",
			"type": "relation",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {
				"collectionId": "pte4fn5mi541cxc",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": 1,
				"displayFields": null
			}
		}`), new_submission); err != nil {
			return err
		}
		collection.Schema.AddField(new_submission)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("270xb773aehpc4p")
		if err != nil {
			return err
		}

		// remove
		collection.Schema.RemoveField("4qnscuph")

		return dao.SaveCollection(collection)
	})
}
