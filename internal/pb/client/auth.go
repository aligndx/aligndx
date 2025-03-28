package pb

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type AuthResponse struct {
	Token  string                 `json:"token"`
	Record map[string]interface{} `json:"record"`
}

// AuthWithPassword logs in a user and sets the auth token in the client
func (c *Client) AuthWithPassword(collection, identity, password string) (*AuthResponse, error) {
	endpoint := fmt.Sprintf("/api/collections/%s/auth-with-password", collection)
	payload := map[string]string{
		"identity": identity,
		"password": password,
	}

	req, err := c.newRequest(http.MethodPost, endpoint, payload)
	if err != nil {
		return nil, err
	}

	respBytes, err := c.doRequestRaw(req)
	if err != nil {
		return nil, err
	}

	var authResp AuthResponse
	if err := json.Unmarshal(respBytes, &authResp); err != nil {
		return nil, err
	}

	c.AuthToken = "Bearer " + authResp.Token
	return &authResp, nil
}

// RefreshAuth refreshes the current auth token
func (c *Client) RefreshAuth(collection string) (*AuthResponse, error) {
	endpoint := fmt.Sprintf("/api/collections/%s/auth-refresh", collection)
	req, err := c.newRequest(http.MethodPost, endpoint, nil)
	if err != nil {
		return nil, err
	}

	respBytes, err := c.doRequestRaw(req)
	if err != nil {
		return nil, err
	}

	var authResp AuthResponse
	if err := json.Unmarshal(respBytes, &authResp); err != nil {
		return nil, err
	}

	c.AuthToken = "Bearer " + authResp.Token
	return &authResp, nil
}

// Impersonate another auth record by ID
func (c *Client) Impersonate(collection, recordId string, durationSeconds int) (*AuthResponse, error) {
	endpoint := fmt.Sprintf("/api/collections/%s/impersonate/%s", collection, recordId)
	var payload map[string]any
	if durationSeconds > 0 {
		payload = map[string]any{"duration": durationSeconds}
	}

	req, err := c.newRequest(http.MethodPost, endpoint, payload)
	if err != nil {
		return nil, err
	}

	respBytes, err := c.doRequestRaw(req)
	if err != nil {
		return nil, err
	}

	var authResp AuthResponse
	if err := json.Unmarshal(respBytes, &authResp); err != nil {
		return nil, err
	}

	c.AuthToken = "Bearer " + authResp.Token
	return &authResp, nil
}

func (c *Client) tryRefreshOrReauth() error {
	if c.AuthCollection == "" || c.Identity == "" || c.Password == "" {
		return fmt.Errorf("missing auth credentials for re-authentication")
	}

	// First try refresh
	_, err := c.RefreshAuth(c.AuthCollection)
	if err == nil {
		fmt.Println("🔄 Token refreshed successfully.")
		return nil
	}

	// Fallback to re-login
	fmt.Println("🔐 Refresh failed, retrying login...")
	_, err = c.AuthWithPassword(c.AuthCollection, c.Identity, c.Password)
	if err == nil {
		fmt.Println("✅ Login successful.")
	}
	return err
}
