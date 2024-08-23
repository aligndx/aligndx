package jobs

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/logger"
)

type JobHandler func(ctx context.Context, inputs map[string]interface{}) error

type Job struct {
	JobID     string                 `json:"job_id"`
	JobInputs map[string]interface{} `json:"job_inputs"`
	JobSchema string                 `json:"job_schema"`
}

type JobServiceInterface interface {
	QueueJob(ctx context.Context, jobID string, jobInputs map[string]interface{}, jobSchema string) error
	RegisterJobHandler(schema string, handler JobHandler)
	ProcessJobs(ctx context.Context, maxConcurrency int) error
}

type MessageQueueService interface {
	Publish(ctx context.Context, subject string, data []byte) error
	Subscribe(ctx context.Context, handler func([]byte, string)) error
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
	StatusQueued     JobStatus = "queued"
	StatusProcessing JobStatus = "processing"
	StatusFinished   JobStatus = "finished"
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

func (s *JobService) updateJobStatus(ctx context.Context, jobID, status string) error {
	statusUpdate := map[string]interface{}{"status": status}
	statusData, err := json.Marshal(statusUpdate)
	if err != nil {
		return fmt.Errorf("error marshaling status update: %w", err)
	}
	err = s.mq.Publish(ctx, fmt.Sprintf("%s.%s.status", s.subjectPrefix, jobID), statusData)
	if err != nil {
		return fmt.Errorf("error publishing job status: %w", err)
	}
	return nil
}

func (s *JobService) QueueJob(ctx context.Context, jobID string, jobInputs map[string]interface{}, jobSchema string) error {
	job := Job{
		JobID:     jobID,
		JobInputs: jobInputs,
		JobSchema: jobSchema,
	}

	jobData, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("error marshaling job data: %w", err)
	}

	// Publish to a single queue
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

	if err := handler(ctx, job.JobInputs); err != nil {
		s.updateJobStatus(ctx, job.JobID, string(StatusError))
		return fmt.Errorf("error processing job (job_id: %s): %w", job.JobID, err)
	}

	if err := s.updateJobStatus(ctx, job.JobID, string(StatusFinished)); err != nil {
		return err
	}

	return nil
}

func (s *JobService) ProcessJobs(ctx context.Context, maxConcurrency int) error {
	// Create a buffered channel (semaphore) with maxConcurrency slots
	semaphore := make(chan struct{}, maxConcurrency)

	return s.mq.Subscribe(ctx, func(msgData []byte, subject string) {

		expectedSubject := fmt.Sprintf("%s.request", s.subjectPrefix)
		if subject != expectedSubject {
			s.log.Debug("Ignoring message with non-request subject", map[string]interface{}{"subject": subject})
			return
		}
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

func (s *JobService) RegisterJobHandler(schema string, handler JobHandler) {
	s.handlers[schema] = handler
	s.log.Info("Job handler registered", map[string]interface{}{"job_schema": schema})
}
