package nextflow

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	pb "github.com/aligndx/aligndx/internal/pb/client"
)

func prepareInputsJSON(client *pb.Client, inputs map[string]interface{}, schema map[string]interface{}, jobDir string) (string, error) {
	for key, input := range inputs {
		if !isFileInput(key, schema) {
			continue
		}

		fileIDs, ok := input.([]interface{})
		if !ok {
			return "", fmt.Errorf("input for %s must be an array of file IDs", key)
		}

		inputDir := filepath.Join(jobDir, key)
		if err := os.MkdirAll(inputDir, os.ModePerm); err != nil {
			return "", fmt.Errorf("failed to create dir for input %s: %w", key, err)
		}

		for _, idRaw := range fileIDs {
			fileID, ok := idRaw.(string)
			if !ok {
				return "", fmt.Errorf("file ID in input %s is not a string", key)
			}

			record, err := client.ViewRecord("data", fileID, nil)
			if err != nil {
				return "", fmt.Errorf("failed to fetch record %s: %w", fileID, err)
			}
			fmt.Println(record)

			fileName, ok := record["file"].(string)
			if !ok || fileName == "" {
				return "", fmt.Errorf("missing file name in record %s", fileID)
			}

			// Download file to inputDir
			destPath := filepath.Join(inputDir, sanitizeFileName(fileName))
			opts := map[string]string{"token": "true"}
			if err := client.DownloadFile("data", fileID, fileName, destPath, opts); err != nil {
				return "", fmt.Errorf("failed to download file %s: %w", fileName, err)
			}
		}

		// Replace file ID list with local directory path
		inputs[key] = inputDir
	}

	// Save to JSON
	inputsJSON, err := json.Marshal(inputs)
	if err != nil {
		return "", fmt.Errorf("failed to marshal inputs: %w", err)
	}

	tmpfile, err := os.CreateTemp("", "aligndx_nf_params_*.json")
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	defer tmpfile.Close()

	if _, err := tmpfile.Write(inputsJSON); err != nil {
		return "", fmt.Errorf("failed to write JSON: %w", err)
	}

	return tmpfile.Name(), nil
}

func isFileInput(key string, schema map[string]interface{}) bool {
	properties, ok := schema["properties"].(map[string]interface{})
	if !ok {
		return false
	}

	fieldSchema, ok := properties[key].(map[string]interface{})
	if !ok {
		return false
	}

	format, hasFormat := fieldSchema["format"].(string)
	return hasFormat && format == "file-path"
}

func sanitizeFileName(fileName string) string {
	return strings.ReplaceAll(fileName, " ", "_")
}
