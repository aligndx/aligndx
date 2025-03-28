package pb

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
)

// --- LIST / SEARCH RECORDS ---
func (c *Client) ListRecords(collection string, query url.Values) (map[string]any, error) {
	endpoint := fmt.Sprintf("/api/collections/%s/records", collection)
	if len(query) > 0 {
		endpoint += "?" + query.Encode()
	}

	req, err := c.newRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	return c.doRequest(req)
}

// --- VIEW A RECORD ---
func (c *Client) ViewRecord(collection, id string, query url.Values) (map[string]any, error) {
	endpoint := fmt.Sprintf("/api/collections/%s/records/%s", collection, id)
	if len(query) > 0 {
		endpoint += "?" + query.Encode()
	}

	req, err := c.newRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	return c.doRequest(req)
}

// --- CREATE A RECORD ---
func (c *Client) CreateRecord(collection string, data map[string]any, query url.Values) (map[string]any, error) {
	endpoint := fmt.Sprintf("/api/collections/%s/records", collection)
	if len(query) > 0 {
		endpoint += "?" + query.Encode()
	}

	req, err := c.newRequest(http.MethodPost, endpoint, data)
	if err != nil {
		return nil, err
	}

	return c.doRequest(req)
}

// --- UPDATE A RECORD ---
func (c *Client) UpdateRecord(collection, id string, data map[string]any, query url.Values) (map[string]any, error) {
	endpoint := fmt.Sprintf("/api/collections/%s/records/%s", collection, id)
	if len(query) > 0 {
		endpoint += "?" + query.Encode()
	}

	req, err := c.newRequest(http.MethodPatch, endpoint, data)
	if err != nil {
		return nil, err
	}

	return c.doRequest(req)
}

// --- DELETE A RECORD ---
func (c *Client) DeleteRecord(collection, id string) error {
	endpoint := fmt.Sprintf("/api/collections/%s/records/%s", collection, id)
	req, err := c.newRequest(http.MethodDelete, endpoint, nil)
	if err != nil {
		return err
	}

	_, err = c.doRequest(req)
	return err
}

// --- BATCH REQUEST ---
type BatchRequest struct {
	Method string         `json:"method"`
	URL    string         `json:"url"`
	Body   map[string]any `json:"body,omitempty"`
}

func (c *Client) Batch(requests []BatchRequest) ([]map[string]any, error) {
	payload := map[string]any{
		"requests": requests,
	}
	req, err := c.newRequest(http.MethodPost, "/api/batch", payload)
	if err != nil {
		return nil, err
	}

	respData, err := c.doRequestRaw(req)
	if err != nil {
		return nil, err
	}

	var results []map[string]any
	if err := json.Unmarshal(respData, &results); err != nil {
		return nil, err
	}
	return results, nil
}
