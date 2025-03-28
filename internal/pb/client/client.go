package pb

import (
	"net/http"
	"strings"
	"time"
)

type Client struct {
	BaseURL          string
	HTTPClient       *http.Client
	AuthToken        string
	AuthCollection   string
	Identity         string
	Password         string
	hasCheckedHealth bool

	HealthRetryCount int
	HealthRetryDelay time.Duration
}

func NewClient(baseURL, authToken string) *Client {
	return &Client{
		BaseURL:          strings.TrimSuffix(baseURL, "/"),
		HTTPClient:       http.DefaultClient,
		AuthToken:        authToken,
		HealthRetryCount: 5,
		HealthRetryDelay: 2 * time.Second,
	}
}

func (c *Client) SetAuthCredentials(collection, identity, password string) {
	c.AuthCollection = collection
	c.Identity = identity
	c.Password = password
}
