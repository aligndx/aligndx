package pb

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

type HealthResponse struct {
	Code    int                    `json:"code"`
	Message string                 `json:"message"`
	Data    map[string]interface{} `json:"data"`
}

// HealthCheck checks the health of the PocketBase server
func (c *Client) HealthCheck(fields string) (*HealthResponse, error) {
	query := url.Values{}
	if fields != "" {
		query.Set("fields", fields)
	}

	endpoint := "/api/health"
	if len(query) > 0 {
		endpoint += "?" + query.Encode()
	}

	req, err := c.newRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	respBytes, err := c.doRequestRaw(req)
	if err != nil {
		return nil, err
	}

	var healthResp HealthResponse
	if err := json.Unmarshal(respBytes, &healthResp); err != nil {
		return nil, err
	}
	return &healthResp, nil
}

func (c *Client) checkInitialHealth() error {
	var err error
	for i := 0; i < c.HealthRetryCount; i++ {
		var health *HealthResponse
		health, err = c.HealthCheck("")
		if err == nil && health.Code == 200 {
			fmt.Println("✅ Server is healthy:", health.Message)
			return nil
		}

		if i < c.HealthRetryCount-1 {
			fmt.Printf("🕐 Server not healthy, retrying in %v... (%d/%d)\n", c.HealthRetryDelay, i+1, c.HealthRetryCount)
			time.Sleep(c.HealthRetryDelay)
		}
	}
	return fmt.Errorf("server did not pass health check after %d attempts: %w", c.HealthRetryCount, err)
}
