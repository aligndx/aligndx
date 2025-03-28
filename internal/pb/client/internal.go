package pb

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func (c *Client) newRequest(method, endpoint string, body any) (*http.Request, error) {
	var buf io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		buf = bytes.NewBuffer(b)
	}

	req, err := http.NewRequest(method, c.BaseURL+endpoint, buf)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	if c.AuthToken != "" {
		req.Header.Set("Authorization", c.AuthToken)
	}
	return req, nil
}

func (c *Client) doRequest(req *http.Request) (map[string]any, error) {
	respBytes, err := c.doRequestRaw(req)
	if err != nil {
		return nil, err
	}
	var result map[string]any
	if err := json.Unmarshal(respBytes, &result); err != nil {
		return nil, err
	}
	return result, nil
}

func (c *Client) doRequestRaw(req *http.Request) ([]byte, error) {
	if !c.hasCheckedHealth {
		if err := c.checkInitialHealth(); err != nil {
			return nil, fmt.Errorf("❌ server health check failed: %w", err)
		}
		c.hasCheckedHealth = true
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// If unauthorized, try refreshing auth
	if resp.StatusCode == 401 {
		fmt.Println("🔁 Token expired. Attempting refresh...")
		if err := c.tryRefreshOrReauth(); err != nil {
			return nil, err
		}
		// Retry the request with new token
		req2 := req.Clone(req.Context())
		req2.Header.Set("Authorization", c.AuthToken)

		resp2, err := c.HTTPClient.Do(req2)
		if err != nil {
			return nil, err
		}
		defer resp2.Body.Close()

		if resp2.StatusCode >= 400 {
			body, _ := io.ReadAll(resp2.Body)
			return nil, fmt.Errorf("HTTP %d: %s", resp2.StatusCode, body)
		}
		return io.ReadAll(resp2.Body)
	}

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, body)
	}

	return io.ReadAll(resp.Body)
}
