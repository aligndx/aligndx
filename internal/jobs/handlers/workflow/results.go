package workflow

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/aligndx/aligndx/internal/config"
	pb "github.com/aligndx/aligndx/internal/pb/client"
)

func StoreResults(client *pb.Client, cfg *config.Config, userId, submissionID, resultsDir string) error {
	// Create ZIP archive from results
	zipPath := filepath.Join(os.TempDir(), fmt.Sprintf("results_%s.zip", submissionID))
	if err := zipDirectory(resultsDir, zipPath); err != nil {
		return fmt.Errorf("failed to zip results: %w", err)
	}
	defer os.Remove(zipPath)

	// Upload zip file as a record
	zipFileInfo, err := os.Stat(zipPath)
	if err != nil {
		return fmt.Errorf("failed to stat zip: %w", err)
	}

	recordData := map[string]any{
		"name":       filepath.Base(zipPath),
		"type":       "archive",
		"size":       zipFileInfo.Size(),
		"user":       userId,
		"submission": submissionID,
	}

	files := map[string]string{"file": zipPath}

	zipRecord, err := client.CreateRecord("data", recordData, files, nil)
	if err != nil {
		return fmt.Errorf("failed to upload zip: %w", err)
	}

	// Link uploaded record to the submission
	data := map[string]any{"outputs": zipRecord["id"]}
	if _, err := client.UpdateRecord("submissions", submissionID, data, nil, nil); err != nil {
		return fmt.Errorf("failed to update submission: %w", err)
	}

	return nil
}

func zipDirectory(sourceDir, zipPath string) error {
	outFile, err := os.Create(zipPath)
	if err != nil {
		return err
	}
	defer outFile.Close()

	zipWriter := zip.NewWriter(outFile)
	defer zipWriter.Close()

	return filepath.WalkDir(sourceDir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(sourceDir, path)
		if err != nil {
			return err
		}

		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		fw, err := zipWriter.Create(relPath)
		if err != nil {
			return err
		}
		_, err = io.Copy(fw, file)
		return err
	})
}
