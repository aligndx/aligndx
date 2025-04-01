package mq

import (
	"context"
	"errors"
	"fmt"

	"github.com/aligndx/aligndx/internal/logger"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

type JetStreamMessageQueueService struct {
	js         jetstream.JetStream
	streamName string
	log        *logger.LoggerWrapper
}

// NewJetStreamMessageQueueService creates a new JetStream message queue service using a full stream configuration.
func NewJetStreamMessageQueueService(ctx context.Context, url string, streamConfig jetstream.StreamConfig, log *logger.LoggerWrapper) (*JetStreamMessageQueueService, error) {
	nc, err := nats.Connect(url)
	if err != nil {
		log.Error("Failed to connect to NATS server", map[string]interface{}{
			"url":   url,
			"error": err.Error(),
		})
		return nil, fmt.Errorf("failed to connect to NATS server: %w", err)
	}
	log.Debug("Connected to NATS server", map[string]interface{}{
		"url": url,
	})

	js, err := jetstream.New(nc)
	if err != nil {
		log.Error("Failed to initialize JetStream", map[string]interface{}{
			"error": err.Error(),
		})
		return nil, fmt.Errorf("failed to initialize JetStream: %w", err)
	}

	log.Debug("JetStream initialized", nil)

	_, err = js.CreateStream(ctx, streamConfig)
	if err != nil {
		if !errors.Is(err, jetstream.ErrStreamNameAlreadyInUse) {
			log.Error("Failed to create stream", map[string]interface{}{
				"streamName": streamConfig.Name,
				"subjects":   streamConfig.Subjects,
				"error":      err.Error(),
			})
			return nil, fmt.Errorf("failed to create stream (streamName: %s, subjects: %v): %w", streamConfig.Name, streamConfig.Subjects, err)
		} else {
			log.Warn("Stream already exists", map[string]interface{}{
				"streamName": streamConfig.Name,
				"subjects":   streamConfig.Subjects,
			})
		}
	} else {
		log.Debug("Stream created", map[string]interface{}{
			"streamName": streamConfig.Name,
			"subjects":   streamConfig.Subjects,
		})
	}

	return &JetStreamMessageQueueService{
		js:         js,
		streamName: streamConfig.Name,
		log:        log,
	}, nil
}

// Publish sends a message to the given subject.
func (s *JetStreamMessageQueueService) Publish(ctx context.Context, subject string, data []byte) error {
	_, err := s.js.Publish(ctx, subject, data)
	if err != nil {
		return fmt.Errorf("failed to publish message (subject: %s): %w", subject, err)
	}
	s.log.Debug("Message published", map[string]interface{}{
		"subject": subject,
	})
	return nil
}

// SubscribeWithConfig subscribes using a provided consumer configuration.
func (s *JetStreamMessageQueueService) SubscribeWithConfig(ctx context.Context, consumerConfig jetstream.ConsumerConfig, handler func(jetstream.Msg)) error {
	cons, err := s.js.CreateOrUpdateConsumer(ctx, s.streamName, consumerConfig)
	if err != nil {
		return fmt.Errorf("failed to create or update consumer (streamName: %s): %w", s.streamName, err)
	}
	s.log.Debug("Consumer created or updated", map[string]interface{}{
		"streamName":   s.streamName,
		"consumerName": consumerConfig.Durable,
	})

	consContext, err := cons.Consume(func(msg jetstream.Msg) {
		s.log.Debug("Message received", map[string]interface{}{
			"streamName": s.streamName,
			"subject":    msg.Subject(),
			"data":       string(msg.Data()),
		})
		handler(msg)
		if ackErr := msg.Ack(); ackErr != nil {
			s.log.Error("Failed to acknowledge message", map[string]interface{}{
				"error": ackErr.Error(),
			})
		} else {
			s.log.Debug("Message acknowledged", nil)
		}
	})
	if err != nil {
		return fmt.Errorf("failed to start consuming messages: %w", err)
	}

	go func() {
		<-ctx.Done()
		s.log.Debug("Context cancelled, stopping consumer", nil)
		consContext.Stop()
	}()
	return nil
}

// Subscribe implements the MessageQueueService interface.
// It constructs a consumer config from the given subject and consumerName and then calls SubscribeWithConfig.
func (s *JetStreamMessageQueueService) Subscribe(ctx context.Context, subject string, consumerName string, handler func(jetstream.Msg)) error {
	consumerConfig := jetstream.ConsumerConfig{
		Durable:       consumerName,
		AckPolicy:     jetstream.AckExplicitPolicy,
		DeliverPolicy: jetstream.DeliverAllPolicy,
		FilterSubject: subject,
	}
	return s.SubscribeWithConfig(ctx, consumerConfig, handler)
}
