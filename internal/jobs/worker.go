package jobs

import (
	"encoding/json"
	"fmt"
	"log"
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

	_, err := js.QueueSubscribe("jobs.*", "job_workers", processJob, nats.Durable("job_worker_durable"), nats.ManualAck())
	if err != nil {
		log.Fatalf("Error subscribing to jobs: %v", err)
	}

	fmt.Println("Worker started and waiting for jobs...")
}
