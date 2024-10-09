package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/logger"
	"github.com/aligndx/aligndx/internal/pb_client"
)

type BaseJobHandler func(ctx context.Context, inputs interface{}) error

type Job struct {
	JobID     string      `json:"job_id"`
	JobInputs interface{} `json:"job_inputs"`
	JobSchema string      `json:"job_schema"`
}

type Event struct {
	Type      string  `json:"type"`
	Message   string  `json:"message"`
	TimeStamp string  `json:"timestamp"`
	MetaData  *string `json:"metadata,omitempty"`
}

type JobServiceInterface interface {
	QueueJob(ctx context.Context, jobID string, jobInputs interface{}, jobSchema string) error
	RegisterJobHandler(schema string, handler BaseJobHandler)
	ProcessJobs(ctx context.Context, maxConcurrency int) error
	SubscribeToJob(ctx context.Context, jobId string, emit func([]byte)) error
}

type MessageQueueService interface {
	Publish(ctx context.Context, subject string, data []byte) error
	Subscribe(ctx context.Context, subject string, consumerName string, handler func([]byte)) error
}

type JobService struct {
	mq            MessageQueueService
	log           *logger.LoggerWrapper
	cfg           *config.Config
	handlers      map[string]BaseJobHandler
	stream        string
	subjectPrefix string
}

type JobStatus string

const (
	StatusCreated    JobStatus = "created"
	StatusQueued     JobStatus = "queued"
	StatusProcessing JobStatus = "processing"
	StatusCompleted  JobStatus = "completed"
	StatusError      JobStatus = "error"
)

func NewJobService(mq MessageQueueService, log *logger.LoggerWrapper, cfg *config.Config, stream string, subjectPrefix string) JobServiceInterface {
	return &JobService{
		mq:            mq,
		log:           log,
		cfg:           cfg,
		handlers:      make(map[string]BaseJobHandler),
		stream:        stream,
		subjectPrefix: subjectPrefix,
	}
}

func (s *JobService) updateJobStatus(ctx context.Context, jobID, status string) error {
	client := pb_client.NewPocketBaseClient(s.cfg.API.URL)

	// Authenticate as admin
	err := client.Authenticate(s.cfg.API.DefaultAdminEmail, s.cfg.API.DefaultAdminPassword, true)
	if err != nil {
		return fmt.Errorf("failed to authenticate as admin: %w", err)
	}

	updateData := map[string]interface{}{
		"status": status,
	}

	_, err = client.Update("submissions", jobID, updateData)
	if err != nil {
		return fmt.Errorf("failed to update submission record with jobID %s: %w", jobID, err)
	}

	// Create an event to represent the job status update
	event := Event{
		Type:      "job.status",
		Message:   fmt.Sprintf("Job %s status updated to %s", jobID, status),
		TimeStamp: time.Now().Format(time.RFC3339),
	}

	// Marshal the Event struct to JSON
	eventData, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("error marshaling event data: %w", err)
	}

	// Publish the event data to the message queue
	err = s.mq.Publish(ctx, fmt.Sprintf("%s.%s.status", s.subjectPrefix, jobID), eventData)
	if err != nil {
		return fmt.Errorf("error publishing job status: %w", err)
	}

	return nil
}

func (s *JobService) QueueJob(ctx context.Context, jobID string, jobInputs interface{}, jobSchema string) error {
	job := Job{
		JobID:     jobID,
		JobInputs: jobInputs,
		JobSchema: jobSchema,
	}

	// Marshal the Job struct to JSON
	jobData, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("error marshaling job data: %w", err)
	}

	// Publish to the queue
	err = s.mq.Publish(ctx, fmt.Sprintf("%s.request", s.subjectPrefix), jobData)
	if err != nil {
		return fmt.Errorf("error publishing job: %w", err)
	}

	if err := s.updateJobStatus(ctx, job.JobID, string(StatusQueued)); err != nil {
		return err
	}

	s.log.Info("Job queued", map[string]interface{}{"job_id": jobID})
	return nil
}

func (s *JobService) processJob(ctx context.Context, msgData []byte) error {
	var job Job
	if err := json.Unmarshal(msgData, &job); err != nil {
		return fmt.Errorf("error unmarshalling job data: %w", err)
	}

	handler, exists := s.handlers[job.JobSchema]
	if !exists {
		s.updateJobStatus(ctx, job.JobID, string(StatusError))
		return fmt.Errorf("no handler registered for schema: %s", job.JobSchema)
	}

	if err := s.updateJobStatus(ctx, job.JobID, string(StatusProcessing)); err != nil {
		return err
	}

	// Directly pass the deserialized byte data to handler
	if err := handler(ctx, job.JobInputs); err != nil {
		s.updateJobStatus(ctx, job.JobID, string(StatusError))
		return fmt.Errorf("error processing job (job_id: %s): %w", job.JobID, err)
	}

	if err := s.updateJobStatus(ctx, job.JobID, string(StatusCompleted)); err != nil {
		return err
	}

	return nil
}

func (s *JobService) ProcessJobs(ctx context.Context, maxConcurrency int) error {
	// Create a buffered channel (semaphore) with maxConcurrency slots
	semaphore := make(chan struct{}, maxConcurrency)
	expectedSubject := fmt.Sprintf("%s.request", s.subjectPrefix)
	consumerName := "request-worker"
	return s.mq.Subscribe(ctx, expectedSubject, consumerName, func(msgData []byte) {
		// Acquire a slot in the semaphore
		semaphore <- struct{}{}

		// Process the job in a separate goroutine
		go func() {
			defer func() {
				// Release the slot in the semaphore after the job is done
				<-semaphore
			}()

			if err := s.processJob(ctx, msgData); err != nil {
				s.log.Error("Failed to process job", map[string]interface{}{"error": err.Error()})
			} else {
				s.log.Info("Job processed successfully")
			}
		}()
	})
}

func (s *JobService) RegisterJobHandler(schema string, handler BaseJobHandler) {
	s.handlers[schema] = handler
	s.log.Info("Job handler registered", map[string]interface{}{"job_schema": schema})
}

func (s *JobService) SubscribeToJob(ctx context.Context, jobId string, emit func([]byte)) error {
	subject := fmt.Sprintf("%s.%s.>", s.subjectPrefix, jobId)

	return s.mq.Subscribe(ctx, subject, jobId, func(msgData []byte) {
		emit(msgData)
	})
}
