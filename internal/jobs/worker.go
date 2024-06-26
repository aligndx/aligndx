package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/nats-io/nats.go"
)

var cli *client.Client

func StartWorker() {
	js := getJetStream()
	var err error
	cli, err = client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Fatal("Error creating client", map[string]interface{}{"error": err})
	}

	sub, err := js.QueueSubscribe("jobs.*", "job_workers", processJob, nats.Durable("job_worker_durable"), nats.ManualAck())
	if err != nil {
		log.Fatal("Error subscribing to jobs", map[string]interface{}{"error": err})
	}

	log.Info("Worker started and waiting for jobs...", nil)

	// Handle shutdown signals
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel() // Ensure the context is cancelled on function exit

	go handleShutdown(cancel, sub)

	// Wait for shutdown signal
	waitForShutdown(ctx)
}

func processJob(msg *nats.Msg) {
	var job Job
	err := json.Unmarshal(msg.Data, &job)
	if err != nil {
		log.Error("Error unmarshaling job data", map[string]interface{}{"error": err})
		return
	}

	if job.Status != "running" {
		job.Status = "running"
		log.Info("Job is running", map[string]interface{}{"job_id": job.JobID})

		runCommand := []string{"run", string(job.Status)}
		launchJob(cli, runCommand)

	}

	// Acknowledge the message to JetStream
	msg.Ack()
}

func launchJob(cli *client.Client, cmd []string) {
	ctx := context.Background()
	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image: "nextflow/nextflow",
		Cmd:   cmd,
	}, nil, nil, nil, "")
	if err != nil {
		log.Fatal("Could not construct the container", map[string]interface{}{"error": err})
	}

	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		log.Fatal("Could not start the container", map[string]interface{}{"error": err})
	}

	fmt.Printf("Started container %s\n", resp.ID)
}

func handleShutdown(cancel context.CancelFunc, sub *nats.Subscription) {
	defer cancel()

	// Unsubscribe from the NATS subscription
	if err := sub.Unsubscribe(); err != nil {
		log.Error("Error unsubscribing", map[string]interface{}{"error": err})
	}

	// Close the NATS connection
	if err := sub.Drain(); err != nil {
		log.Error("Error draining subscription", map[string]interface{}{"error": err})
	}

	log.Info("Shutdown complete", nil)
}

func waitForShutdown(ctx context.Context) {
	// Create a channel to listen for OS signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Block until a signal is received or context is cancelled
	select {
	case sig := <-sigChan:
		log.Info("Received signal, initiating shutdown...", map[string]interface{}{"signal": sig})
	case <-ctx.Done():
	}

	log.Info("Worker shutting down...", nil)
}
