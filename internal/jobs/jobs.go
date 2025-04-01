package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/jobs/mq"
	"github.com/aligndx/aligndx/internal/logger"
	"github.com/nats-io/nats.go/jetstream"
)

// JobHandler is a function that processes a job.
type JobHandler func(ctx context.Context, inputs interface{}) error

// Job represents a job that can be queued and processed.
type Job struct {
	ID     string      `json:"job_id"`
	Inputs interface{} `json:"job_inputs"`
	Schema string      `json:"job_schema"`
}

// Event is a generic event type.
type Event[T any] struct {
	Type      string `json:"type"`
	Message   string `json:"message"`
	TimeStamp string `json:"timestamp"`
	MetaData  T      `json:"metadata,omitempty"`
}

// JobServiceInterface defines the methods of our job service.
type JobServiceInterface interface {
	Queue(ctx context.Context, id string, inputs interface{}, schema string) error
	RegisterJobHandler(schema string, handler JobHandler)
	Process(ctx context.Context, maxConcurrency int) error
	Subscribe(ctx context.Context, subject string, consumerName string, handler func(jetstream.Msg)) error
	ReplaySubscribe(ctx context.Context, subject string, handler func(jetstream.Msg)) error
}

// MessageQueueService is used by the job service.
type MessageQueueService interface {
	Publish(ctx context.Context, subject string, data []byte) error
	Subscribe(ctx context.Context, subject string, consumerName string, handler func(jetstream.Msg)) error
}

// JobService implements JobServiceInterface and encapsulates its own MQ and config setup.
type JobService struct {
	workQueueMQ   MessageQueueService
	eventMQ       MessageQueueService
	log           *logger.LoggerWrapper
	cfg           *config.Config
	handlers      map[string]JobHandler
	subjectPrefix string
}

// JobStatus represents the state of a job.
type JobStatus string

const (
	StatusCreated    JobStatus = "created"
	StatusQueued     JobStatus = "queued"
	StatusProcessing JobStatus = "processing"
	StatusCompleted  JobStatus = "completed"
	StatusError      JobStatus = "error"
)

// NewJobService returns a new instance of JobService.
func NewJobService(ctx context.Context, log *logger.LoggerWrapper, cfg *config.Config) (JobServiceInterface, error) {
	// Setup the work queue stream configuration using WorkQueuePolicy.
	workQueueConfig := jetstream.StreamConfig{
		Name:      "QUEUE",
		Retention: jetstream.WorkQueuePolicy, // Work queue retention policy
		Subjects:  []string{"jobs.request"},
		Storage:   jetstream.FileStorage,
	}
	workQueueMQ, err := mq.NewJetStreamMessageQueueService(ctx, cfg.MQ.URL, workQueueConfig, log)
	if err != nil {
		log.Error("Failed to initialize work queue MQ service", map[string]interface{}{"error": err.Error()})
		return nil, fmt.Errorf("failed to initialize work queue mq: %w", err)
	}

	// Setup the event stream configuration using a replayable retention policy (LimitsPolicy).
	eventStreamConfig := jetstream.StreamConfig{
		Name:      "EVENTS",
		Retention: jetstream.LimitsPolicy,    // Replayable retention for job events
		Subjects:  []string{"jobs.events.>"}, // Catch-all for all events
		Storage:   jetstream.FileStorage,
	}
	eventMQ, err := mq.NewJetStreamMessageQueueService(ctx, cfg.MQ.URL, eventStreamConfig, log)
	if err != nil {
		log.Error("Failed to initialize event MQ service", map[string]interface{}{"error": err.Error()})
		return nil, fmt.Errorf("failed to initialize event mq: %w", err)
	}

	return &JobService{
		workQueueMQ:   workQueueMQ,
		eventMQ:       eventMQ,
		log:           log,
		cfg:           cfg,
		handlers:      make(map[string]JobHandler),
		subjectPrefix: "jobs",
	}, nil
}

// StatusEventMetadata defines metadata for job status events.
type StatusEventMetadata struct {
	JobID  string    `json:"jobid"`
	Status JobStatus `json:"status"`
}

// updateJobStatus publishes an event to update a job’s status.
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
	subj := fmt.Sprintf("%s.events.status.%s", s.subjectPrefix, ID)
	return s.eventMQ.Publish(ctx, subj, data)
}

// Queue creates a job and publishes it to the job queue.
func (s *JobService) Queue(ctx context.Context, id string, inputs interface{}, schema string) error {
	job := Job{
		ID:     id,
		Inputs: inputs,
		Schema: schema,
	}

	jobData, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("error marshaling job data: %w", err)
	}

	// Publish the job to the work queue.
	if err := s.workQueueMQ.Publish(ctx, fmt.Sprintf("%s.request", s.subjectPrefix), jobData); err != nil {
		return fmt.Errorf("error publishing job: %w", err)
	}

	s.log.Debug("Job queued", map[string]interface{}{"job_id": id})
	return nil
}

// processJob unmarshals the job data and executes the registered handler.
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

	if err := handler(ctx, job.Inputs); err != nil {
		s.updateJobStatus(ctx, job.ID, StatusError)
		return fmt.Errorf("error processing job (job_id: %s): %w", job.ID, err)
	}

	return s.updateJobStatus(ctx, job.ID, StatusCompleted)
}

// Process subscribes to job requests and processes them concurrently up to maxConcurrency.
func (s *JobService) Process(ctx context.Context, maxConcurrency int) error {
	semaphore := make(chan struct{}, maxConcurrency)
	subject := fmt.Sprintf("%s.request", s.subjectPrefix)
	consumerName := "request-worker"

	return s.workQueueMQ.Subscribe(ctx, subject, consumerName, func(msg jetstream.Msg) {
		semaphore <- struct{}{}
		go func() {
			defer func() { <-semaphore }()
			if err := s.processJob(ctx, msg.Data()); err != nil {
				s.log.Error("Failed to process job", map[string]interface{}{"error": err.Error()})
			} else {
				s.log.Debug("Job processed successfully", nil)
			}
		}()
	})
}

// RegisterJobHandler registers a handler for jobs with the specified schema.
func (s *JobService) RegisterJobHandler(schema string, handler JobHandler) {
	s.handlers[schema] = handler
	s.log.Debug("Job handler registered", map[string]interface{}{"job_schema": schema})
}

// Subscribe subscribes to job status events.
func (s *JobService) Subscribe(ctx context.Context, subject string, consumerName string, handler func(jetstream.Msg)) error {
	finalSubject := fmt.Sprintf("%s.events.%s", s.subjectPrefix, subject)
	return s.eventMQ.Subscribe(ctx, finalSubject, consumerName, handler)
}

// ReplaySubscribe creates an ephemeral subscription that replays all matching events.
func (s *JobService) ReplaySubscribe(ctx context.Context, subject string, handler func(jetstream.Msg)) error {
	finalSubject := fmt.Sprintf("%s.events.%s", s.subjectPrefix, subject)
	// Create an ephemeral consumer configuration by not setting Durable.
	consumerConfig := jetstream.ConsumerConfig{
		AckPolicy:     jetstream.AckExplicitPolicy,
		DeliverPolicy: jetstream.DeliverAllPolicy,
		FilterSubject: finalSubject,
	}
	jsMQ, ok := s.eventMQ.(*mq.JetStreamMessageQueueService)
	if !ok {
		return fmt.Errorf("unable to type assert eventMQ to *mq.JetStreamMessageQueueService")
	}
	return jsMQ.SubscribeWithConfig(ctx, consumerConfig, handler)
}
