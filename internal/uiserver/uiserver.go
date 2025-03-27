package uiserver

import (
	"net/http"
	"path"
	"strings"

	"github.com/aligndx/aligndx/ui"
)

// Starts an HTTP server that serves the embedded UI files.
func StartUIServer(port string) error {

	fileSystem := http.FS(ui.OutDirFS)
	fileServer := http.FileServer(fileSystem)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Check if the requested file exists using the enhanced fileExists function
		filePath := fileExists(fileSystem, r.URL.Path)
		if filePath != "" {
			// Update the request URL to the actual path to serve the correct file
			r.URL.Path = filePath
			fileServer.ServeHTTP(w, r)
		} else {
			// Fallback to index.html for client-side routing
			http.ServeFile(w, r, path.Join("ui", "out", "index.html"))
		}
	})

	return http.ListenAndServe(":"+port, nil)
}

// fileExists checks if a given file exists in the embedded filesystem.
func fileExists(fs http.FileSystem, filePath string) string {
	// Remove leading "/" for compatibility with the embedded filesystem
	trimmedPath := strings.TrimPrefix(filePath, "/")

	// First, check if the exact file exists
	if file, err := fs.Open(trimmedPath); err == nil {
		defer file.Close()
		stat, err := file.Stat()
		if err == nil && !stat.IsDir() {
			return filePath
		}
	}

	// If exact match is not found, try appending ".html"
	htmlPath := trimmedPath + ".html"
	if file, err := fs.Open(htmlPath); err == nil {
		defer file.Close()
		stat, err := file.Stat()
		if err == nil && !stat.IsDir() {
			return "/" + htmlPath // Return with leading "/" since it will be used in the request URL
		}
	}

	// If neither exist, return an empty string
	return ""
}
