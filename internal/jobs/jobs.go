package jobs

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/nats-io/nats.go"
)

type Job struct {
	JobID     string                 `json:"job_id"`
	JobInputs map[string]interface{} `json:"job_inputs"`
	JobSchema string                 `json:"job_schema"`
	Status    string                 `json:"status"`
}

const (
	streamName = "JOBS"
)

var (
	nc   *nats.Conn
	js   nats.JetStreamContext
	once sync.Once
	err  error
)

func initJetStream() {
	once.Do(func() {
		cfg := config.GetConfig()
		nc, err = nats.Connect(cfg.Nats.URL)
		if err != nil {
			log.Fatalf("Error connecting to NATS: %v", err)
		}

		js, err = nc.JetStream()
		if err != nil {
			log.Fatalf("Error creating JetStream context: %v", err)
		}

		_, err = js.AddStream(&nats.StreamConfig{
			Name:     streamName,
			Subjects: []string{"jobs.*"},
		})
		if err != nil {
			log.Fatalf("Error creating stream: %v", err)
		}
	})
}

func getJetStream() nats.JetStreamContext {
	initJetStream()
	return js
}

func queueJob(jobID string, jobInputs map[string]interface{}, jobSchema string) {
	js := getJetStream()

	job := Job{
		JobID:     jobID,
		JobInputs: jobInputs,
		JobSchema: jobSchema,
		Status:    "queued",
	}

	jobData, err := json.Marshal(job)
	if err != nil {
		log.Fatalf("Error marshaling job data: %v", err)
	}

	_, err = js.Publish(fmt.Sprintf("jobs.%s", jobID), jobData)
	if err != nil {
		log.Fatalf("Error publishing job: %v", err)
	}

	fmt.Printf("Job %s queued\n", jobID)
}

func getJobInfo(jobID string) {
	js := getJetStream()

	// Use the correct subject to fetch the specific job message
	subject := fmt.Sprintf("jobs.%s", jobID)

	// Fetch the last message for the given subject
	msg, err := js.GetLastMsg(streamName, subject)
	if err != nil {
		log.Fatalf("Error fetching job message: %v", err)
	}

	var job Job
	err = json.Unmarshal(msg.Data, &job)
	if err != nil {
		log.Fatalf("Error unmarshaling job data: %v", err)
	}

	fmt.Printf("Job Info: %+v\n", job)
}

func cancelJob(jobID string) {
	js := getJetStream()

	// Use the correct subject to fetch the specific job message
	subject := fmt.Sprintf("jobs.%s", jobID)

	// Fetch the last message for the given subject
	msg, err := js.GetLastMsg(streamName, subject)
	if err != nil {
		log.Fatalf("Error fetching job message: %v", err)
	}

	var job Job
	err = json.Unmarshal(msg.Data, &job)
	if err != nil {
		log.Fatalf("Error unmarshaling job data: %v", err)
	}

	// Update the job status to cancelled
	job.Status = "cancelled"

	// Marshal the updated job data
	jobData, err := json.Marshal(job)
	if err != nil {
		log.Fatalf("Error marshaling job data: %v", err)
	}

	// Publish the updated job message back to the JetStream
	_, err = js.Publish(subject, jobData)
	if err != nil {
		log.Fatalf("Error publishing job: %v", err)
	}

	fmt.Printf("Job %s cancelled\n", jobID)
}
