package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		jsonData := `{
			"id": "pte4fn5mi541cxc",
			"created": "2024-06-22 02:30:57.231Z",
			"updated": "2024-06-22 02:30:57.231Z",
			"name": "submissions",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "0wubcnrf",
					"name": "user",
					"type": "relation",
					"required": true,
					"presentable": true,
					"unique": false,
					"options": {
						"collectionId": "_pb_users_auth_",
						"cascadeDelete": true,
						"minSelect": null,
						"maxSelect": null,
						"displayFields": null
					}
				},
				{
					"system": false,
					"id": "vpnjppyi",
					"name": "workflow",
					"type": "relation",
					"required": true,
					"presentable": true,
					"unique": false,
					"options": {
						"collectionId": "g0ueed9jy9c6atp",
						"cascadeDelete": false,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": null
					}
				},
				{
					"system": false,
					"id": "pvth3huo",
					"name": "name",
					"type": "text",
					"required": true,
					"presentable": true,
					"unique": false,
					"options": {
						"min": null,
						"max": null,
						"pattern": ""
					}
				},
				{
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
				},
				{
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
				}
			],
			"indexes": [],
			"listRule": "@request.auth.id != \"\" && user.id ?= @request.auth.id",
			"viewRule": "@request.auth.id != \"\" && user.id ?= @request.auth.id",
			"createRule": "@request.auth.id != \"\" && user.id ?= @request.auth.id",
			"updateRule": "@request.auth.id != \"\" && user.id ?= @request.auth.id",
			"deleteRule": "@request.auth.id != \"\" && user.id ?= @request.auth.id",
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("pte4fn5mi541cxc")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
