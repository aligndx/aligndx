package nextflow

import (
	"fmt"
	"os"
	"path/filepath"

	pb "github.com/aligndx/aligndx/internal/pb/client"
)

// uploadFolder creates a record for a folder with the given parentID
// and returns the record ID.
func uploadFolder(client *pb.Client, userId, submissionID, relPath, folderName, parentID string) (string, error) {
	recordData := map[string]any{
		"name":         folderName,
		"relativePath": relPath,
		"type":         "folder",
		"user":         userId,
		"submission":   submissionID,
		"parent":       parentID,
	}
	rec, err := client.CreateRecord("data", recordData, nil, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create folder record for %s: %w", relPath, err)
	}
	id, ok := rec["id"].(string)
	if !ok {
		return "", fmt.Errorf("folder record for %s did not return a valid id", relPath)
	}
	return id, nil
}

// uploadFile creates a record for a file with the given parentID, including file upload,
// and returns the record ID.
func uploadFile(client *pb.Client, userId, submissionID, relPath, fileName, filePath, parentID string, fileSize int64) (string, error) {
	recordData := map[string]any{
		"name":         fileName,
		"relativePath": relPath,
		"type":         "file",
		"size":         fileSize,
		"user":         userId,
		"submission":   submissionID,
		"parent":       parentID,
	}
	files := map[string]string{"file": filePath}
	rec, err := client.CreateRecord("data", recordData, files, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create file record for %s: %w", filePath, err)
	}
	id, ok := rec["id"].(string)
	if !ok {
		return "", fmt.Errorf("file record for %s did not return a valid id", filePath)
	}
	return id, nil
}

// TraverseResultsDirectory walks the resultsDir and creates records for every folder and file,
// maintaining hierarchy by mapping each folder’s full path to its record ID.
// The initial parentID should be passed in (usually an empty string) and the function returns
// the record ID for the first folder directly under resultsDir (the "root" folder).
func TraverseResultsDirectory(client *pb.Client, userId, submissionID, resultsDir, initialParentID string) (string, error) {
	var rootRecordID string
	// Map to store folder full paths to their corresponding record IDs.
	parentIDMap := make(map[string]string)
	baseClean := filepath.Clean(resultsDir)
	parentIDMap[baseClean] = initialParentID

	err := filepath.Walk(resultsDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		cleanPath := filepath.Clean(path)
		// Skip the base directory itself.
		if cleanPath == baseClean {
			return nil
		}

		// Compute the relative path with respect to resultsDir.
		relPath, err := filepath.Rel(resultsDir, cleanPath)
		if err != nil {
			return err
		}

		// Determine the parent directory and look up its record ID.
		parentDir := filepath.Dir(cleanPath)
		parentDir = filepath.Clean(parentDir)
		parentRecID, ok := parentIDMap[parentDir]
		if !ok {
			parentRecID = initialParentID // Fallback if not found.
		}

		if info.IsDir() {
			recID, err := uploadFolder(client, userId, submissionID, relPath, info.Name(), parentRecID)
			if err != nil {
				return err
			}
			// Save this folder's record ID for its children.
			parentIDMap[cleanPath] = recID

			// For the first level (child of resultsDir), store as the root record.
			if parentDir == baseClean && rootRecordID == "" {
				rootRecordID = recID
			}
		} else {
			// For files, get the file size.
			recID, err := uploadFile(client, userId, submissionID, relPath, info.Name(), cleanPath, parentRecID, info.Size())
			if err != nil {
				return err
			}
			// You might choose to do something with file record IDs if needed.
			_ = recID
		}
		return nil
	})
	if err != nil {
		return "", err
	}
	return rootRecordID, nil
}

// StoreResults is the main function that traverses the results directory,
// uploads all folders and files (while preserving hierarchy), and then updates
// the submission record with the root output record ID.
func StoreResults(client *pb.Client, userId, submissionID, resultsDir string) error {
	// Traverse the directory structure.
	rootRecordID, err := TraverseResultsDirectory(client, userId, submissionID, resultsDir, "")
	if err != nil {
		return fmt.Errorf("failed to traverse results directory: %w", err)
	}

	// Update the submission record with the root output.
	updateData := map[string]any{"outputs": rootRecordID}
	_, err = client.UpdateRecord("submissions", submissionID, updateData, nil, nil)
	if err != nil {
		return fmt.Errorf("failed to update submission record: %w", err)
	}
	return nil
}
