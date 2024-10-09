package pb_client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"time"
)

// PocketBaseClient represents the PocketBase API client
type PocketBaseClient struct {
	BaseURL      string
	HTTPClient   *http.Client
	AuthToken    string
	AuthTokenExp time.Time
}

// NewPocketBaseClient creates a new PocketBaseClient instance
func NewPocketBaseClient(baseURL string) *PocketBaseClient {
	return &PocketBaseClient{
		BaseURL:    baseURL,
		HTTPClient: &http.Client{},
	}
}

// Authenticate authenticates a user or admin and stores the auth token in the client instance
func (c *PocketBaseClient) Authenticate(email, password string, isAdmin bool) error {
	var url string
	if isAdmin {
		url = fmt.Sprintf("%s/api/admins/auth-with-password", c.BaseURL)
	} else {
		url = fmt.Sprintf("%s/api/collections/users/auth-with-password", c.BaseURL)
	}

	body := map[string]string{
		"identity": email,
		"password": password,
	}
	bodyBytes, _ := json.Marshal(body)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to authenticate, status code: %d", resp.StatusCode)
	}

	var responseMap map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&responseMap); err != nil {
		return err
	}

	if token, ok := responseMap["token"].(string); ok {
		c.AuthToken = token
		c.AuthTokenExp = time.Now().Add(1 * time.Hour) // Assuming the token expires in 1 hour
		return nil
	}

	return fmt.Errorf("failed to parse authentication token")
}

// sendRequest sends an HTTP request and handles token expiration automatically
func (c *PocketBaseClient) sendRequest(req *http.Request) (*http.Response, error) {
	// Check if the token is expired or about to expire
	if time.Now().After(c.AuthTokenExp) {
		fmt.Println("Token expired, attempting to re-authenticate...")
		// Re-authenticate
		return nil, fmt.Errorf("token expired, please re-authenticate")
	}

	c.setAuthHeader(req)
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}

	// If unauthorized, indicate that re-authentication is needed
	if resp.StatusCode == http.StatusUnauthorized {
		fmt.Println("Token expired or invalid, please re-authenticate...")
		return nil, fmt.Errorf("token expired or invalid, please re-authenticate")
	}

	return resp, nil
}

// Create creates a new record in the specified collection
func (c *PocketBaseClient) Create(collection string, data map[string]interface{}) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/collections/%s/records", c.BaseURL, collection)
	bodyBytes, _ := json.Marshal(data)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.sendRequest(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to create record, status code: %d", resp.StatusCode)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result, nil
}

// CreateWithMultipart creates a new record in the specified collection using multipart form data
func (c *PocketBaseClient) CreateWithMultipart(collection string, fields map[string]string, files map[string]string) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/collections/%s/records", c.BaseURL, collection)
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add fields to the multipart form
	for key, val := range fields {
		_ = writer.WriteField(key, val)
	}

	// Add files to the multipart form
	for fieldname, filepath := range files {
		file, err := os.Open(filepath)
		if err != nil {
			return nil, fmt.Errorf("failed to open file %s: %w", filepath, err)
		}
		defer file.Close()

		fileWriter, err := writer.CreateFormFile(fieldname, filepath)
		if err != nil {
			return nil, fmt.Errorf("failed to create form file for %s: %w", filepath, err)
		}

		if _, err = io.Copy(fileWriter, file); err != nil {
			return nil, fmt.Errorf("failed to copy file %s to form: %w", filepath, err)
		}
	}

	writer.Close()

	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := c.sendRequest(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to create record, status code: %d", resp.StatusCode)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result, nil
}

// Update updates an existing record in the specified collection
func (c *PocketBaseClient) Update(collection string, recordID string, data map[string]interface{}) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/collections/%s/records/%s", c.BaseURL, collection, recordID)
	bodyBytes, _ := json.Marshal(data)

	req, err := http.NewRequest("PATCH", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.sendRequest(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to update record, status code: %d", resp.StatusCode)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result, nil
}

// Delete deletes a record in the specified collection
func (c *PocketBaseClient) Delete(collection string, recordID string) error {
	url := fmt.Sprintf("%s/api/collections/%s/records/%s", c.BaseURL, collection, recordID)
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return err
	}

	resp, err := c.sendRequest(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("failed to delete record, status code: %d", resp.StatusCode)
	}

	return nil
}

// List retrieves records with pagination, filtering, and sorting
func (c *PocketBaseClient) List(collection string, params url.Values) ([]map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/collections/%s/records?%s", c.BaseURL, collection, params.Encode())
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.sendRequest(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to list records, status code: %d", resp.StatusCode)
	}

	var responseMap map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&responseMap); err != nil {
		return nil, err
	}

	records, ok := responseMap["items"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("failed to parse records list")
	}

	result := make([]map[string]interface{}, 0)
	for _, record := range records {
		recordMap, ok := record.(map[string]interface{})
		if ok {
			result = append(result, recordMap)
		}
	}

	return result, nil
}

// setAuthHeader sets the Authorization header if an AuthToken is available
func (c *PocketBaseClient) setAuthHeader(req *http.Request) {
	if c.AuthToken != "" {
		req.Header.Set("Authorization", "Bearer "+c.AuthToken)
	}
}
