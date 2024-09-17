package workflow

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/aligndx/aligndx/internal/config"
)

// FileDetails represents the file details needed to construct the file URL in PocketBase.
type FileDetails struct {
	CollectionID string `json:"collection_id"`
	RecordID     string `json:"record_id"`
	FileName     string `json:"file_name"`
}

// prepareJSONFile processes inputs, retrieves file URLs for file inputs, and prepares a JSON file.
func prepareJSONFile(cfg *config.Config, inputs map[string]interface{}, schema map[string]interface{}, jobDir string) (string, error) {
	// Authenticate as admin to get the token
	adminToken, err := AuthenticateAsAdmin(cfg.API.URL, cfg.API.DefaultAdminEmail, cfg.API.DefaultAdminPassword)
	if err != nil {
		return "", fmt.Errorf("failed to authenticate as admin: %w", err)
	}

	// Process inputs, identifying file inputs from the schema
	for key, input := range inputs {
		// Check if the current key is identified as a file in the schema
		if isFileInput(key, schema) {
			// Expecting an array of file IDs
			fileIDs, ok := input.([]interface{})
			if !ok {
				return "", fmt.Errorf("input field for key %s should be an array of file IDs", key)
			}

			// Create a subdirectory for this input in the tempDir
			inputDir := filepath.Join(jobDir, key)
			err := os.Mkdir(inputDir, os.ModePerm)
			if err != nil {
				return "", fmt.Errorf("failed to create subdirectory for input %s: %w", key, err)
			}

			// Download each file to the input-specific subdirectory
			for _, fileID := range fileIDs {
				fileIDStr, ok := fileID.(string)
				if !ok {
					return "", fmt.Errorf("invalid file ID format for key %s", key)
				}

				// Get the file URL using the admin token
				fileURL, err := getFileURL(adminToken, cfg.API.URL, fileIDStr)
				if err != nil {
					return "", fmt.Errorf("failed to retrieve file URL for file ID %s in key %s: %w", fileIDStr, key, err)
				}

				// Download the file to the input-specific subdirectory
				_, err = downloadFile(fileURL, inputDir)
				if err != nil {
					return "", fmt.Errorf("failed to download file from URL %s: %w", fileURL, err)
				}
			}

			// Set the path to the subdirectory as the value for this input key
			inputs[key] = inputDir
		}
	}

	// Convert inputs to JSON
	inputsJSON, err := json.Marshal(inputs)
	if err != nil {
		return "", fmt.Errorf("failed to marshal inputs to JSON: %w", err)
	}

	// Create a temporary file to save the JSON
	tmpfile, err := os.CreateTemp("", "aligndx_nf_params_*.json")
	if err != nil {
		return "", fmt.Errorf("failed to create temporary file: %w", err)
	}

	// Write JSON to the temporary file
	if _, err := tmpfile.Write(inputsJSON); err != nil {
		tmpfile.Close() // Close the file before returning error
		return "", fmt.Errorf("failed to write JSON to temporary file: %w", err)
	}
	if err := tmpfile.Close(); err != nil {
		return "", fmt.Errorf("failed to close temporary file: %w", err)
	}

	// Return the path of the temporary JSON file
	return tmpfile.Name(), nil
}

// downloadFile downloads a file from a given URL and saves it to the specified directory.
func downloadFile(fileURL, destDir string) (string, error) {
	// Create a HTTP request to download the file
	resp, err := http.Get(fileURL)
	if err != nil {
		return "", fmt.Errorf("failed to download file from URL %s: %w", fileURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to download file, status: %s", resp.Status)
	}

	// Parse the URL to handle query parameters
	parsedURL, err := url.Parse(fileURL)
	if err != nil {
		return "", fmt.Errorf("failed to parse URL %s: %w", fileURL, err)
	}

	// Extract the file name from the URL path (ignore query parameters like "?token=...")
	fileName := filepath.Base(parsedURL.Path)

	// Clean the filename if needed (optional depending on specific cases)
	fileName = sanitizeFileName(fileName)

	// Define the full path to save the file
	filePath := filepath.Join(destDir, fileName)

	// Create the file on the local filesystem
	out, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file %s: %w", filePath, err)
	}
	defer out.Close()

	// Copy the content from the HTTP response to the file
	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to save file %s: %w", filePath, err)
	}

	// Return the path to the downloaded file
	return filePath, nil
}

// sanitizeFileName ensures that the file name is safe to use on the file system (optional depending on your needs)
func sanitizeFileName(fileName string) string {
	// Replace any unwanted characters from the file name if needed
	// This is optional depending on what filenames are acceptable in your system
	return strings.ReplaceAll(fileName, " ", "_")
}

// isFileInput checks if a given key in the inputs map corresponds to a file input in the schema.
func isFileInput(key string, schema map[string]interface{}) bool {
	// Look up the schema definition for the given key
	properties, ok := schema["properties"].(map[string]interface{})
	if !ok {
		return false
	}

	fieldSchema, ok := properties[key].(map[string]interface{})
	if !ok {
		return false
	}

	// Check if the "format" or any other attribute identifies it as a file input
	fieldFormat, hasFormat := fieldSchema["format"].(string)

	// For example, "file-path" format can be considered as a file input
	if hasFormat && fieldFormat == "file-path" {
		return true
	}

	// Additional checks can be added here to handle other file-related formats
	return false
}

// getFileURL retrieves the file URL from PocketBase for a given file ID using the admin token.
// It first fetches the file details from the PocketBase record and mandates the use of a token for secure access.
func getFileURL(adminToken, apiURL, fileID string) (string, error) {
	// Construct the URL to retrieve the file details
	recordURL := fmt.Sprintf("%s/api/collections/data/records/%s", apiURL, fileID)

	// Create the request to fetch the file record details
	req, err := http.NewRequest("GET", recordURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create record request: %w", err)
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", adminToken))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to request file record: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to retrieve file record, status: %s", resp.Status)
	}

	// Decode the response body to extract the file details
	var record map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&record)
	if err != nil {
		return "", fmt.Errorf("failed to decode file record response: %w", err)
	}

	// Extract the file name from the record's "file" property
	fileName, ok := record["file"].(string)
	if !ok {
		return "", fmt.Errorf("file name not found in the record")
	}

	// Construct the base URL for the file
	fileURL := fmt.Sprintf("%s/api/files/data/%s/%s", apiURL, fileID, fileName)

	// Fetch the file token using POST request
	tokenURL := fmt.Sprintf("%s/api/files/token", apiURL)
	tokenReq, err := http.NewRequest("POST", tokenURL, nil) // Use POST method
	if err != nil {
		return "", fmt.Errorf("failed to create token request: %w", err)
	}
	tokenReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", adminToken))

	tokenResp, err := client.Do(tokenReq)
	if err != nil {
		return "", fmt.Errorf("failed to request file token: %w", err)
	}
	defer tokenResp.Body.Close()

	if tokenResp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to retrieve file token, status: %s", tokenResp.Status)
	}

	// Parse the token response
	var tokenData map[string]interface{}
	err = json.NewDecoder(tokenResp.Body).Decode(&tokenData)
	if err != nil {
		return "", fmt.Errorf("failed to decode token response: %w", err)
	}

	token, ok := tokenData["token"].(string)
	if !ok {
		return "", fmt.Errorf("file token not found in the response")
	}

	// Append the token to the file URL
	fileURL = fmt.Sprintf("%s?token=%s", fileURL, token)

	// Return the constructed file URL
	return fileURL, nil
}
