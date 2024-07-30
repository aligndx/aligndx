package jobs

import (
	"encoding/json"
	"errors"
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
	QueueJob(jobID string, jobInputs map[string]interface{}, jobSchema string) error
	GetJobInfo(jobID string) (*Job, error)
	CancelJob(jobID string) error
	RunJob(jobID string) error
	RegisterJobHandler(schema string, handler JobHandler)
}

type MessageQueueService interface {
	Publish(subject string, data []byte) error
	GetLastMsg(subject string) ([]byte, error)
}

type JobService struct {
	mq        MessageQueueService
	log       *logger.LoggerWrapper
	cfg       *config.Config
	handlers  map[string]JobHandler
	jobPrefix string
}

func NewJobService(mq MessageQueueService, log *logger.LoggerWrapper, cfg *config.Config, jobPrefix string) JobServiceInterface {
	return &JobService{
		mq:        mq,
		log:       log,
		cfg:       cfg,
		handlers:  make(map[string]JobHandler),
		jobPrefix: jobPrefix,
	}
}

func (s *JobService) QueueJob(jobID string, jobInputs map[string]interface{}, jobSchema string) error {
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
	err = s.mq.Publish(fmt.Sprintf("%s.%s", s.jobPrefix, jobID), jobData)
	if err != nil {
		s.log.Error("Error publishing job", map[string]interface{}{"error": err})
		return err
	}

	s.log.Info("Job queued", map[string]interface{}{"job_id": jobID})
	return nil
}

func (s *JobService) GetJobInfo(jobID string) (*Job, error) {
	subject := fmt.Sprintf("%s.%s", s.jobPrefix, jobID)

	msgData, err := s.mq.GetLastMsg(subject)
	if err != nil {
		s.log.Error("Error fetching job message", map[string]interface{}{"error": err})
		return nil, err
	}

	var job Job
	err = json.Unmarshal(msgData, &job)
	if err != nil {
		s.log.Error("Error unmarshaling job data", map[string]interface{}{"error": err})
		return nil, err
	}

	s.log.Info("Job Info", map[string]interface{}{"job": job})
	return &job, nil
}

func (s *JobService) CancelJob(jobID string) error {
	job, err := s.GetJobInfo(jobID)
	if err != nil {
		return err
	}

	job.Status = "cancelled"

	jobData, err := json.Marshal(job)
	if err != nil {
		s.log.Error("Error marshaling job data", map[string]interface{}{"error": err})
		return err
	}
	err = s.mq.Publish(fmt.Sprintf("%s.%s", s.jobPrefix, jobID), jobData)
	if err != nil {
		s.log.Error("Error publishing job", map[string]interface{}{"error": err})
		return err
	}

	s.log.Info("Job cancelled", map[string]interface{}{"job_id": jobID})
	return nil
}

func (s *JobService) RunJob(jobID string) error {
	job, err := s.GetJobInfo(jobID)
	if err != nil {
		return err
	}

	handler, exists := s.handlers[job.JobSchema]
	if !exists {
		s.log.Error("No handler registered for job schema", map[string]interface{}{"job_schema": job.JobSchema})
		return errors.New("no handler registered for job schema")
	}

	err = handler(job.JobInputs)
	if err != nil {
		s.log.Error("Error running job", map[string]interface{}{"error": err, "job_id": jobID})
		return err
	}

	job.Status = "completed"

	jobData, err := json.Marshal(job)
	if err != nil {
		s.log.Error("Error marshaling job data", map[string]interface{}{"error": err})
		return err
	}
	err = s.mq.Publish(fmt.Sprintf("%s.%s", s.jobPrefix, jobID), jobData)
	if err != nil {
		s.log.Error("Error publishing job", map[string]interface{}{"error": err})
		return err
	}

	s.log.Info("Job completed", map[string]interface{}{"job_id": jobID})
	return nil
}

func (s *JobService) RegisterJobHandler(schema string, handler JobHandler) {
	s.handlers[schema] = handler
	s.log.Info("Job handler registered", map[string]interface{}{"job_schema": schema})
}
