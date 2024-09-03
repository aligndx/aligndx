package workflow

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

	"github.com/aligndx/aligndx/internal/config"
)

// FileMetadata represents metadata about a file or folder.
type FileMetadata struct {
	Name   string
	Type   string // "file" or "folder"
	Size   int64
	Parent string
	User   string
	Path   string // Include the path to facilitate file uploads
}

// AdminAuthResponse represents the response received upon successful admin authentication.
type AdminAuthResponse struct {
	Token string `json:"token"`
}

// StoreResults processes and stores the workflow results in PocketBase.
func StoreResults(cfg *config.Config, userId string, submissionID string, resultsDir string) error {
	// Authenticate as admin
	adminToken, err := AuthenticateAsAdmin(cfg.API.URL, cfg.API.DefaultAdminEmail, cfg.API.DefaultAdminPassword)
	if err != nil {
		return fmt.Errorf("failed to authenticate as admin: %w", err)
	}

	// Traverse results directory to gather file and folder metadata
	rootRecordID, err := TraverseResultsDirectory(cfg.API.URL, "data", adminToken, resultsDir, "", userId)
	if err != nil {
		return fmt.Errorf("failed to traverse results directory: %w", err)
	}

	// // Upload submission with records into PocketBase
	err = UpdateSubmissionsCollection(cfg.API.URL, adminToken, submissionID, rootRecordID)
	if err != nil {
		return fmt.Errorf("failed to update submissions collection: %w", err)
	}

	return nil
}

// AuthenticateAsAdmin authenticates with PocketBase as an admin and returns an auth token.
func AuthenticateAsAdmin(apiURL, email, password string) (string, error) {
	credentials := map[string]string{
		"identity": email,
		"password": password,
	}

	credentialsBytes, err := json.Marshal(credentials)
	if err != nil {
		return "", fmt.Errorf("failed to marshal admin credentials: %w", err)
	}

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/api/admins/auth-with-password", apiURL), bytes.NewBuffer(credentialsBytes))
	if err != nil {
		return "", fmt.Errorf("failed to create admin auth request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send admin auth request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected response status: %s", resp.Status)
	}

	var authResponse AdminAuthResponse
	err = json.NewDecoder(resp.Body).Decode(&authResponse)
	if err != nil {
		return "", fmt.Errorf("failed to decode admin auth response: %w", err)
	}

	return authResponse.Token, nil
}

// TraverseResultsDirectory traverses the results directory and gathers metadata.
func TraverseResultsDirectory(apiUrl string, collectionName string, adminToken string, basePath string, parentID string, userID string) (string, error) {
	var rootRecordID string
	parentIDMap := make(map[string]string) // Map to maintain parent IDs for directories

	// Initialize stack with the initial parent ID
	parentIDMap[basePath] = parentID

	err := filepath.Walk(basePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Determine the file type
		fileType := "file"
		if info.IsDir() {
			fileType = "folder"
		}

		// Prepare the file metadata
		file := FileMetadata{
			Name: info.Name(),
			Type: fileType,
			Size: info.Size(),
			Path: path,
			User: userID, // Replace with actual user identification if needed
		}

		// Determine the parent ID
		parentDir := filepath.Dir(path)
		currentParentID, ok := parentIDMap[parentDir]
		if !ok {
			currentParentID = parentID // Default to the initial parent ID if not found
		}

		// Create record for the current file or folder
		newParentID, err := createRecord(apiUrl, collectionName, adminToken, file, currentParentID)
		if err != nil {
			return fmt.Errorf("failed to create record for %s: %w", path, err)
		}

		// If this is the root directory (basePath), save the root record ID
		if parentIDMap[basePath] == parentID && rootRecordID == "" {
			rootRecordID = newParentID
		}

		// If the current entry is a directory, add its ID to the map
		if info.IsDir() {
			parentIDMap[path] = newParentID
		}

		// Return to process the next file or folder. filepath.Walk will handle the rest.
		return nil
	})

	if err != nil {
		return "", err
	}

	return rootRecordID, nil
}

// Helper function to create a record and retrieve its ID
func createRecord(apiURL string, collectionName string, adminToken string, file FileMetadata, parentID string) (string, error) {
	client := &http.Client{}
	// Prepare the form data for record creation
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add the regular fields
	_ = writer.WriteField("name", file.Name)
	_ = writer.WriteField("type", file.Type)
	_ = writer.WriteField("size", fmt.Sprintf("%d", file.Size))
	_ = writer.WriteField("parent", parentID)
	_ = writer.WriteField("user", file.User)

	// If the file is a file (not a folder), upload it
	if file.Type == "file" {
		fileWriter, err := writer.CreateFormFile("file", filepath.Base(file.Path))
		if err != nil {
			return "", fmt.Errorf("failed to create form file: %w", err)
		}

		f, err := os.Open(file.Path)
		if err != nil {
			return "", fmt.Errorf("failed to open file: %w", err)
		}
		defer f.Close()

		if _, err = io.Copy(fileWriter, f); err != nil {
			return "", fmt.Errorf("failed to copy file to form file: %w", err)
		}
	}

	writer.Close()

	// Create the HTTP request to insert the record
	req, err := http.NewRequest("POST", fmt.Sprintf("%s/api/collections/%s/records", apiURL, collectionName), body)
	if err != nil {
		return "", fmt.Errorf("failed to create HTTP request: %w", err)
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", adminToken)

	// Send the HTTP request
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send HTTP request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected response status: %s", resp.Status)
	}

	// Decode response to get the record ID
	var recordResponse map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&recordResponse); err != nil {
		return "", fmt.Errorf("failed to decode record response: %w", err)
	}

	// Collect the record ID
	if id, ok := recordResponse["id"].(string); ok {
		return id, nil
	}

	return "", fmt.Errorf("record ID not found in response")
}

// UpdateSubmissionsCollection updates the submissions collection with the provided record IDs.
func UpdateSubmissionsCollection(apiURL, adminToken, submissionID string, recordID string) error {
	client := &http.Client{}

	// Prepare the JSON body for the update
	updateData := map[string]interface{}{
		"outputs": recordID,
	}
	bodyBytes, err := json.Marshal(updateData)
	if err != nil {
		return fmt.Errorf("failed to marshal update data: %w", err)
	}

	// Create the HTTP request for the update
	req, err := http.NewRequest("PATCH", fmt.Sprintf("%s/api/collections/submissions/records/%s", apiURL, submissionID), bytes.NewBuffer(bodyBytes))
	if err != nil {
		return fmt.Errorf("failed to create update request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", adminToken)

	// Send the HTTP request
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send update request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected response status: %s", resp.Status)
	}

	return nil
}
