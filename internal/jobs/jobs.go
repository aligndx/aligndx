package jobs

import (
	"encoding/json"
	"fmt"
	"sync"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/logger"
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
	log  *logger.LoggerWrapper
)

func initJetStream() {
	once.Do(func() {
		configService := config.NewConfigService(log)
		cfg := configService.LoadConfig()
		nc, err = nats.Connect(cfg.Nats.URL)
		if err != nil {
			log.Fatal("Error connecting to NATS", map[string]interface{}{"error": err})
		}

		js, err = nc.JetStream()
		if err != nil {
			log.Fatal("Error creating JetStream context", map[string]interface{}{"error": err})
		}

		_, err = js.AddStream(&nats.StreamConfig{
			Name:     streamName,
			Subjects: []string{"jobs.*"},
		})
		if err != nil {
			log.Fatal("Error creating stream", map[string]interface{}{"error": err})
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
		log.Fatal("Error marshaling job data", map[string]interface{}{"error": err})
	}

	_, err = js.Publish(fmt.Sprintf("jobs.%s", jobID), jobData)
	if err != nil {
		log.Fatal("Error publishing job", map[string]interface{}{"error": err})
	}

	log.Info("Job queued", map[string]interface{}{"job_id": jobID})
}

func getJobInfo(jobID string) {
	js := getJetStream()

	subject := fmt.Sprintf("jobs.%s", jobID)

	msg, err := js.GetLastMsg(streamName, subject)
	if err != nil {
		log.Fatal("Error fetching job message", map[string]interface{}{"error": err})
	}

	var job Job
	err = json.Unmarshal(msg.Data, &job)
	if err != nil {
		log.Fatal("Error unmarshaling job data", map[string]interface{}{"error": err})
	}

	log.Info("Job Info", map[string]interface{}{"job": job})
}

func cancelJob(jobID string) {
	js := getJetStream()

	subject := fmt.Sprintf("jobs.%s", jobID)

	msg, err := js.GetLastMsg(streamName, subject)
	if err != nil {
		log.Fatal("Error fetching job message", map[string]interface{}{"error": err})
	}

	var job Job
	err = json.Unmarshal(msg.Data, &job)
	if err != nil {
		log.Fatal("Error unmarshaling job data", map[string]interface{}{"error": err})
	}

	job.Status = "cancelled"

	jobData, err := json.Marshal(job)
	if err != nil {
		log.Fatal("Error marshaling job data", map[string]interface{}{"error": err})
	}

	_, err = js.Publish(subject, jobData)
	if err != nil {
		log.Fatal("Error publishing job", map[string]interface{}{"error": err})
	}

	log.Info("Job cancelled", map[string]interface{}{"job_id": jobID})
}
