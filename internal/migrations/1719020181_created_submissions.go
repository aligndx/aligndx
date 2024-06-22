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
			"id": "dh74cjo7zy653i8",
			"created": "2024-06-22 01:36:21.236Z",
			"updated": "2024-06-22 01:36:21.236Z",
			"name": "submissions",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "g0ojvm45",
					"name": "name",
					"type": "text",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"min": null,
						"max": null,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "h5f2nzzx",
					"name": "workflow",
					"type": "relation",
					"required": true,
					"presentable": false,
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
					"id": "as4b88du",
					"name": "user",
					"type": "relation",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"collectionId": "_pb_users_auth_",
						"cascadeDelete": false,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": null
					}
				},
				{
					"system": false,
					"id": "leoltmpo",
					"name": "completed",
					"type": "date",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"min": "",
						"max": ""
					}
				},
				{
					"system": false,
					"id": "ooglskr0",
					"name": "metadata",
					"type": "json",
					"required": true,
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

		collection, err := dao.FindCollectionByNameOrId("dh74cjo7zy653i8")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
