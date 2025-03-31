package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/logger"
)

type JobHandler func(ctx context.Context, inputs interface{}) error

type Job struct {
	ID     string      `json:"job_id"`
	Inputs interface{} `json:"job_inputs"`
	Schema string      `json:"job_schema"`
}

type Event[T any] struct {
	Type      string `json:"type"`
	Message   string `json:"message"`
	TimeStamp string `json:"timestamp"`
	MetaData  T      `json:"metadata,omitempty"`
}

type JobServiceInterface interface {
	Queue(ctx context.Context, ID string, inputs interface{}, schema string) error
	RegisterJobHandler(schema string, handler JobHandler)
	Process(ctx context.Context, maxConcurrency int) error
	Subscribe(ctx context.Context, subject string, consumerID string, emit func([]byte)) error
}

type MessageQueueService interface {
	Publish(ctx context.Context, subject string, data []byte) error
	Subscribe(ctx context.Context, subject string, consumerName string, handler func([]byte)) error
}

type JobService struct {
	mq            MessageQueueService
	log           *logger.LoggerWrapper
	cfg           *config.Config
	handlers      map[string]JobHandler
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
		handlers:      make(map[string]JobHandler),
		stream:        stream,
		subjectPrefix: subjectPrefix,
	}
}

type StatusEventMetadata struct {
	JobID  string    `json:"jobid"`
	Status JobStatus `json:"status"`
}

func (s *JobService) updateJobStatus(ctx context.Context, ID string, status JobStatus) error {
	event := Event[StatusEventMetadata]{
		Type:      "job.status",
		Message:   fmt.Sprintf("Job %s updated to %s", ID, status),
		TimeStamp: time.Now().Format(time.RFC3339),
		MetaData: StatusEventMetadata{
			JobID:  ID,
			Status: status,
		},
	}
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}
	subj := fmt.Sprintf("%s.status.%s", s.subjectPrefix, ID)
	return s.mq.Publish(ctx, subj, data)
}

func (s *JobService) Queue(ctx context.Context, id string, inputs interface{}, schema string) error {
	job := Job{
		ID:     id,
		Inputs: inputs,
		Schema: schema,
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

	err = s.updateJobStatus(ctx, job.ID, StatusQueued)
	if err != nil {
		return fmt.Errorf("error updating job status: %w", err)
	}

	s.log.Debug("Job queued", map[string]interface{}{"job_id": id})
	return nil
}

func (s *JobService) processJob(ctx context.Context, msgData []byte) error {
	var job Job
	if err := json.Unmarshal(msgData, &job); err != nil {
		return fmt.Errorf("error unmarshalling job data: %w", err)
	}

	handler, exists := s.handlers[job.Schema]
	if !exists {
		s.updateJobStatus(ctx, job.ID, StatusError)
		return fmt.Errorf("no handler registered for schema: %s", job.Schema)
	}

	if err := s.updateJobStatus(ctx, job.ID, StatusProcessing); err != nil {
		return err
	}

	// Directly pass the deserialized byte data to handler
	if err := handler(ctx, job.Inputs); err != nil {
		s.updateJobStatus(ctx, job.ID, StatusError)
		return fmt.Errorf("error processing job (job_id: %s): %w", job.ID, err)
	}

	if err := s.updateJobStatus(ctx, job.ID, StatusCompleted); err != nil {
		return err
	}

	return nil
}

func (s *JobService) Process(ctx context.Context, maxConcurrency int) error {
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
				s.log.Debug("Job processed successfully")
			}
		}()
	})
}

func (s *JobService) RegisterJobHandler(schema string, handler JobHandler) {
	s.handlers[schema] = handler
	s.log.Debug("Job handler registered", map[string]interface{}{"job_schema": schema})
}

func (s *JobService) Subscribe(ctx context.Context, subject string, consumerID string, emit func([]byte)) error {
	finalSubject := fmt.Sprintf("%s.%s", s.subjectPrefix, subject)

	return s.mq.Subscribe(ctx, finalSubject, consumerID, func(msgData []byte) {
		emit(msgData)
	})
}
