package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"strings"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/jobs/executor"
	"github.com/aligndx/aligndx/internal/jobs/executor/docker"
	"github.com/aligndx/aligndx/internal/logger"
)

// WorkflowInputs represents the expected inputs for the WorkflowHandler.
type WorkflowInputs struct {
	JobID    string                 `json:"jobid"`
	Workflow string                 `json:"workflow"`
	Inputs   map[string]interface{} `json:"inputs"`
}

// WorkflowHandlerSpecific contains specific job logic
func WorkflowHandlerSpecific(ctx context.Context, inputs WorkflowInputs) error {
	log := logger.NewLoggerWrapper("zerolog", ctx)
	configService := config.NewConfigService(log)
	cfg := configService.LoadConfig()

	// Proceed with the rest of the workflow handling logic
	jsonFilePath, err := prepareJSONFile(inputs.Inputs)
	if err != nil {
		return fmt.Errorf("failed to prepare JSON file: %w", err)
	}
	defer os.Remove(jsonFilePath)

	// Create a Docker executor
	dockerExec, err := docker.NewDockerExecutor(log)
	if err != nil {
		return fmt.Errorf("failed to create Docker executor: %w", err)
	}
	es := executor.NewExecutorService(dockerExec)

	hostIP, err := getHostIP()
	if err != nil {
		fmt.Printf("Error retrieving host IP: %v\n", err)
		return err
	}
	natsURL := cfg.MQ.URL
	natsURL = replaceLocalhost(natsURL, hostIP)

	// Define Docker options
	dockerConfig := docker.NewDockerConfig(
		"mshunjan/aligndx-nf-nats:latest",
		[]string{"nextflow", "run", inputs.Workflow, "-c", "nextflow.config", "-profile", "docker,test", "--nats_url", natsURL, "--nats_subject", "--outdir", "test", fmt.Sprintf("jobs.%s", inputs.JobID)},
		docker.WithVolumes([]string{fmt.Sprintf("%s:/workspace/params.json", jsonFilePath), "/var/run/docker.sock:/var/run/docker.sock"}),
		docker.WithAutoRemove(false),
		docker.WithWorkingDir("/"),
	)

	// Execute the command with the Docker options
	_, err = es.Execute(ctx, dockerConfig)
	if err != nil {
		return fmt.Errorf("failed to execute job: %w", err)
	}

	return nil
}

// WorkflowHandler is the entry point handler for workflow jobs.
func WorkflowHandler(ctx context.Context, inputs interface{}) error {
	// Assert inputs to be the correct type
	var workflowInputs WorkflowInputs
	inputBytes, err := json.Marshal(inputs) // Marshal interface to JSON first
	if err != nil {
		return fmt.Errorf("failed to marshal inputs: %w", err)
	}

	if err := json.Unmarshal(inputBytes, &workflowInputs); err != nil {
		return fmt.Errorf("failed to unmarshal inputs to WorkflowInputs: %w", err)
	}

	return WorkflowHandlerSpecific(ctx, workflowInputs)
}

func prepareJSONFile(inputs map[string]interface{}) (string, error) {
	// Convert inputs to JSON
	inputsJSON, err := json.Marshal(inputs)
	if err != nil {
		return "", fmt.Errorf("failed to marshal inputs to JSON: %w", err)
	}

	// Create a temporary file to save the JSON
	tmpfile, err := os.CreateTemp("", "aligndx_nf_params_*.json")
	if err != nil {
		return "", fmt.Errorf("failed to create temporary file: %w", err)
	}

	// Write JSON to the temporary file
	if _, err := tmpfile.Write(inputsJSON); err != nil {
		tmpfile.Close() // Close the file before returning error
		return "", fmt.Errorf("failed to write JSON to temporary file: %w", err)
	}
	if err := tmpfile.Close(); err != nil {
		return "", fmt.Errorf("failed to close temporary file: %w", err)
	}

	// Return the path of the temporary JSON file
	return tmpfile.Name(), nil
}

func getHostIP() (string, error) {
	// Get a list of all network interfaces
	interfaces, err := net.Interfaces()
	if err != nil {
		return "", err
	}

	// Iterate over the list of interfaces
	for _, iface := range interfaces {
		// Ignore interfaces that are down or loopback interfaces
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}

		// Get a list of all addresses associated with the interface
		addrs, err := iface.Addrs()
		if err != nil {
			return "", err
		}

		// Iterate over the list of addresses
		for _, addr := range addrs {
			var ip net.IP

			// Check if the address is an IP address or a network address
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}

			// Ignore loopback and IPv6 addresses
			if ip == nil || ip.IsLoopback() || ip.To4() == nil {
				continue
			}

			// Return the first non-loopback, non-link-local IPv4 address
			return ip.String(), nil
		}
	}

	return "", fmt.Errorf("no valid IP address found")
}

// replaceLocalhost replaces "localhost" or "127.0.0.1" in a URL with the actual host IP address.
func replaceLocalhost(url, hostIP string) string {
	// Replace "127.0.0.1" or "localhost" with the host IP address
	url = strings.Replace(url, "127.0.0.1", hostIP, -1)
	url = strings.Replace(url, "localhost", hostIP, -1)
	return url
}
