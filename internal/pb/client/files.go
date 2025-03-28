package pb

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
)

func (c *Client) GetFileToken() (string, error) {
	req, err := c.newRequest(http.MethodPost, "/api/files/token", nil)
	if err != nil {
		return "", err
	}

	respBytes, err := c.doRequestRaw(req)
	if err != nil {
		return "", err
	}

	var resp struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(respBytes, &resp); err != nil {
		return "", err
	}
	return resp.Token, nil
}

// DownloadFile downloads a file and saves it to the given localPath.
// Optional: thumbnail size (e.g. "200x200"), forceDownload=true, useToken=true
func (c *Client) DownloadFile(collection, recordId, filename, localPath string, opts map[string]string) error {
	query := url.Values{}
	if thumb, ok := opts["thumb"]; ok {
		query.Set("thumb", thumb)
	}
	if opts["download"] == "true" {
		query.Set("download", "true")
	}
	if opts["token"] == "true" {
		token, err := c.GetFileToken()
		if err != nil {
			return err
		}
		query.Set("token", token)
	}

	endpoint := fmt.Sprintf("/api/files/%s/%s/%s", collection, recordId, filename)
	if len(query) > 0 {
		endpoint += "?" + query.Encode()
	}

	req, err := c.newRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("download error: HTTP %d - %s", resp.StatusCode, string(body))
	}

	// Ensure local directory exists
	if err := os.MkdirAll(filepath.Dir(localPath), os.ModePerm); err != nil {
		return err
	}

	// Save to file
	out, err := os.Create(localPath)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	return err
}
