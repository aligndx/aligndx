package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nats-io/nats.go"
)

func processJob(msg *nats.Msg) {
	var job Job
	err := json.Unmarshal(msg.Data, &job)
	if err != nil {
		log.Printf("Error unmarshaling job data: %v", err)
		return
	}

	// Placeholder for conditions to check before launching the job
	if true { // Replace with actual conditions
		job.Status = "running"
		fmt.Printf("Job %s is running\n", job.JobID)

		// Simulate job processing
		time.Sleep(2 * time.Second) // Simulate processing time
		job.Status = "completed"
		fmt.Printf("Job %s completed\n", job.JobID)
	}

	// Acknowledge the message to JetStream
	msg.Ack()
}

func StartWorker() {
	js := getJetStream()

	sub, err := js.QueueSubscribe("jobs.*", "job_workers", processJob, nats.Durable("job_worker_durable"), nats.ManualAck())
	if err != nil {
		log.Fatalf("Error subscribing to jobs: %v", err)
	}

	fmt.Println("Worker started and waiting for jobs...")

	// Handle shutdown signals
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel() // Ensure the context is cancelled on function exit

	go handleShutdown(cancel, sub)

	// Wait for shutdown signal
	waitForShutdown(ctx)
}

func handleShutdown(cancel context.CancelFunc, sub *nats.Subscription) {
	defer cancel()

	// Unsubscribe from the NATS subscription
	if err := sub.Unsubscribe(); err != nil {
		log.Printf("Error unsubscribing: %v", err)
	}

	// Close the NATS connection
	if err := sub.Drain(); err != nil {
		log.Printf("Error draining subscription: %v", err)
	}

	fmt.Println("Shutdown complete.")
}

func waitForShutdown(ctx context.Context) {
	// Create a channel to listen for OS signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Block until a signal is received or context is cancelled
	select {
	case sig := <-sigChan:
		fmt.Printf("Received signal: %v, initiating shutdown...\n", sig)
	case <-ctx.Done():
	}

	fmt.Println("Worker shutting down...")
}
