package jobs

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/logger"
)

type JobHandler func(inputs map[string]interface{}) error

type Job struct {
	JobID     string                 `json:"job_id"`
	JobInputs map[string]interface{} `json:"job_inputs"`
	JobSchema string                 `json:"job_schema"`
	Status    string                 `json:"status"`
}

type JobServiceInterface interface {
	QueueJob(ctx context.Context, jobID string, jobInputs map[string]interface{}, jobSchema string) error
	// GetJobInfo(ctx context.Context, jobID string) (*Job, error)
	// CancelJob(ctx context.Context, jobID string) error
	// RunJob(ctx context.Context, jobID string) error
	RegisterJobHandler(schema string, handler JobHandler)
	ProcessJobs(ctx context.Context) error
}

type MessageQueueService interface {
	Publish(ctx context.Context, subject string, data []byte) error
	Subscribe(ctx context.Context, subject string, handler func([]byte)) error
}

type JobService struct {
	mq       MessageQueueService
	log      *logger.LoggerWrapper
	cfg      *config.Config
	handlers map[string]JobHandler
	stream   string
}

func NewJobService(mq MessageQueueService, log *logger.LoggerWrapper, cfg *config.Config, stream string) JobServiceInterface {
	return &JobService{
		mq:       mq,
		log:      log,
		cfg:      cfg,
		handlers: make(map[string]JobHandler),
		stream:   stream,
	}
}

func (s *JobService) QueueJob(ctx context.Context, jobID string, jobInputs map[string]interface{}, jobSchema string) error {
	job := Job{
		JobID:     jobID,
		JobInputs: jobInputs,
		JobSchema: jobSchema,
		Status:    "queued",
	}

	jobData, err := json.Marshal(job)
	if err != nil {
		s.log.Error("Error marshaling job data", map[string]interface{}{"error": err})
		return err
	}
	// publish to single queue
	err = s.mq.Publish(ctx, s.stream, jobData)
	if err != nil {
		s.log.Error("Error publishing job", map[string]interface{}{"error": err})
		return err
	}

	s.log.Info("Job queued", map[string]interface{}{"job_id": jobID})
	return nil
}

func (s *JobService) ProcessJobs(ctx context.Context) error {
	messageHandler := func(msgData []byte) error {
		// Unmarshal the message data into Job structure
		var job Job
		if err := json.Unmarshal(msgData, &job); err != nil {
			s.log.Error("Error unmarshalling job data", map[string]interface{}{"error": err})
			return err
		}

		// Find the handler based on the job's schema
		handler, exists := s.handlers[job.JobSchema]
		if !exists {
			errMsg := fmt.Sprintf("No handler registered for schema: %s", job.JobSchema)
			s.log.Error(errMsg, nil)
			return fmt.Errorf(errMsg)
		}

		// Process the job using the found handler
		if err := handler(job.JobInputs); err != nil {
			s.log.Error("Error processing job", map[string]interface{}{
				"job_id": job.JobID, "error": err,
			})
			return err
		}

		s.log.Info("Job processed successfully", map[string]interface{}{"job_id": job.JobID})
		return nil
	}

	// Subscribe using the internal message handler
	return s.mq.Subscribe(ctx, s.stream, func(msg []byte) {
		if err := messageHandler(msg); err != nil {
			s.log.Error("Failed to handle message", map[string]interface{}{"error": err})
		}
	})
}

func (s *JobService) RegisterJobHandler(schema string, handler JobHandler) {
	s.handlers[schema] = handler
	s.log.Info("Job handler registered", map[string]interface{}{"job_schema": schema})
}
