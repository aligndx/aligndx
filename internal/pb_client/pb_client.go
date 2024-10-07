package pocketbaseclient

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
)

// PocketBaseClient represents the PocketBase API client
type PocketBaseClient struct {
	BaseURL    string
	HTTPClient *http.Client
	AuthToken  string
}

// NewPocketBaseClient creates a new PocketBaseClient instance
func NewPocketBaseClient(baseURL string) *PocketBaseClient {
	return &PocketBaseClient{
		BaseURL:    baseURL,
		HTTPClient: &http.Client{},
	}
}

// Authenticate authenticates the user and stores the auth token in the client instance
func (c *PocketBaseClient) Authenticate(email, password string) error {
	url := fmt.Sprintf("%s/api/collections/users/auth-with-password", c.BaseURL)
	body := map[string]string{
		"email":    email,
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
		return nil
	}

	return fmt.Errorf("failed to parse authentication token")
}

// AuthenticateAsAdmin authenticates an admin user and stores the auth token in the client instance
func (c *PocketBaseClient) AuthenticateAsAdmin(email, password string) error {
	url := fmt.Sprintf("%s/api/admins/auth-with-password", c.BaseURL)
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
		return fmt.Errorf("failed to authenticate as admin, status code: %d", resp.StatusCode)
	}

	var responseMap map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&responseMap); err != nil {
		return err
	}

	if token, ok := responseMap["token"].(string); ok {
		c.AuthToken = token
		return nil
	}

	return fmt.Errorf("failed to parse admin authentication token")
}

// Create creates a new record in the specified collection
func (c *PocketBaseClient) Create(collection string, data map[string]interface{}) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/collections/%s/records", c.BaseURL, collection)
	bodyBytes, _ := json.Marshal(data)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	c.setAuthHeader(req)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.HTTPClient.Do(req)
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
	c.setAuthHeader(req)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send HTTP request: %w", err)
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
	c.setAuthHeader(req)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.HTTPClient.Do(req)
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
	c.setAuthHeader(req)

	resp, err := c.HTTPClient.Do(req)
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
	c.setAuthHeader(req)

	resp, err := c.HTTPClient.Do(req)
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
		req.Header.Set("Authorization", c.AuthToken)
	}
}

// Usage Example
/*
func main() {
	client := NewPocketBaseClient("http://127.0.0.1:8090")
	err := client.Authenticate("user@example.com", "password")
	if err != nil {
		fmt.Println("Error authenticating:", err)
		return
	}

	// Create a new record
	data := map[string]interface{}{
		"name": "John Doe",
		"age": 30,
	}
	record, err := client.Create("exampleCollection", data)
	if err != nil {
		fmt.Println("Error creating record:", err)
		return
	}
	fmt.Println("Created record:", record)

	// Create a new record with multipart
	fields := map[string]string{
		"name": "Jane Doe",
		"type": "file",
	}
	files := map[string]string{
		"file": "./example.txt",
	}
	record, err = client.CreateWithMultipart("exampleCollection", fields, files)
	if err != nil {
		fmt.Println("Error creating record with multipart:", err)
		return
	}
	fmt.Println("Created record with multipart:", record)

	// Authenticate as admin
	err = client.AuthenticateAsAdmin("admin@example.com", "adminpassword")
	if err != nil {
		fmt.Println("Error authenticating as admin:", err)
		return
	}
	fmt.Println("Authenticated as admin")
}
*/
