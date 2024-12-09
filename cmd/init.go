package cmd

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/spf13/cobra"
)

func InitCommand() *cobra.Command {
	command := &cobra.Command{
		Use:   "init",
		Short: "Setup Aligndx",
		RunE: func(cmd *cobra.Command, args []string) error {
			return setupNextflow()
		},
	}
	return command
}

func setupNextflow() error {
	// Step 0: Create pb_data/workflow folder structure
	if err := createWorkflowFolder(); err != nil {
		return fmt.Errorf("error creating workflow folder: %v", err)
	}

	// Step 1: Check for Java
	if !checkJava() {
		return fmt.Errorf("Java is not installed or incompatible. Please install Java 17 or later and ensure it is available in your PATH.\n" +
			"Recommended installation method: SDKMAN (https://sdkman.io/install).")
	}
	fmt.Println("Java is installed and compatible.")

	// Step 2: Check for Docker
	if !checkDocker() {
		return fmt.Errorf("Docker is not installed or not running. Please install Docker and ensure it is running.\n" +
			"Visit https://docs.docker.com/get-docker/ for installation instructions.")
	}
	fmt.Println("Docker is installed and running.")

	// Step 3: Install Nextflow
	if err := installNextflow(); err != nil {
		return fmt.Errorf("error installing Nextflow: %v", err)
	}

	fmt.Println("Setup complete!")
	return nil
}

func createWorkflowFolder() error {
	homeDir, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("unable to determine home directory: %v", err)
	}

	workflowDir := filepath.Join(homeDir, "pb_data", "workflow")
	if err := os.MkdirAll(workflowDir, 0755); err != nil {
		return fmt.Errorf("unable to create directory %s: %v", workflowDir, err)
	}

	fmt.Printf("Created workflow folder at: %s\n", workflowDir)
	return nil
}

func checkJava() bool {
	cmd := exec.Command("java", "-version")
	err := cmd.Run()
	return err == nil
}

func checkDocker() bool {
	cmd := exec.Command("docker", "info")
	err := cmd.Run()
	return err == nil
}

func installNextflow() error {
	currentDir, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("unable to determine current directory: %v", err)
	}
	workflowDir := filepath.Join(currentDir, "pb_data", "workflow")
	nextflowPath := filepath.Join(workflowDir, "nextflow")

	// Step 0: Check if Nextflow is already installed
	if _, err := os.Stat(nextflowPath); err == nil {
		fmt.Printf("Nextflow is already installed at %s. Skipping installation.\n", nextflowPath)
		return nil
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("error checking Nextflow installation: %v", err)
	}

	var stderr bytes.Buffer

	// Step 1: Download Nextflow
	cmd := exec.CommandContext(context.Background(), "bash", "-c", fmt.Sprintf("curl -s https://get.nextflow.io | bash && mv nextflow %s", workflowDir))
	cmd.Stdout = io.Discard // Suppress standard output
	cmd.Stderr = &stderr    // Capture standard error
	if err := cmd.Run(); err != nil {
		log.Printf("Error during Nextflow installation: %s", stderr.String())
		return err
	}

	// Step 2: Make Nextflow executable
	cmd = exec.CommandContext(context.Background(), "chmod", "+x", nextflowPath)
	cmd.Stdout = io.Discard // Suppress standard output
	cmd.Stderr = io.Discard // Suppress standard error
	if err := cmd.Run(); err != nil {
		return err
	}

	// Step 3: Ensure PATH is updated
	fmt.Println("Ensure the directory ./pb_data/workflow is in your PATH variable.")
	return nil
}
