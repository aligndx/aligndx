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

func NewJetStreamMessageQueueService(ctx context.Context, url string, streamName string, subject string, log *logger.LoggerWrapper) (*JetStreamMessageQueueService, error) {

	nc, err := nats.Connect(url)
	if err != nil {
		log.Error("Failed to connect to NATS server", map[string]interface{}{
			"url":   url,
			"error": err.Error(),
		})
		return nil, fmt.Errorf("failed to connect to NATS server: %w", err)
	}
	log.Info("Connected to NATS server", map[string]interface{}{
		"url": url,
	})

	js, err := jetstream.New(nc)
	if err != nil {
		log.Error("Failed to initialize JetStream", map[string]interface{}{
			"error": err.Error(),
		})
		return nil, fmt.Errorf("failed to initialize JetStream: %w", err)
	}

	log.Info("JetStream initialized", nil)

	cfg := jetstream.StreamConfig{
		Name:      streamName,
		Retention: jetstream.WorkQueuePolicy,
		Subjects:  []string{subject},
		Storage:   jetstream.FileStorage,
	}

	_, err = js.CreateStream(ctx, cfg)
	if err != nil {
		log.Error("Failed to create stream", map[string]interface{}{
			"streamName": streamName,
			"subject":    subject,
			"error":      err,
		})
		return nil, fmt.Errorf("failed to create stream (streamName: %s, subject: %s): %w", streamName, subject, err)
	}
	log.Info("Stream created", map[string]interface{}{
		"streamName": streamName,
		"subject":    subject,
	})

	return &JetStreamMessageQueueService{
		js:         js,
		streamName: streamName,
		log:        log,
	}, nil
}

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

func (s *JetStreamMessageQueueService) Subscribe(ctx context.Context, subject string, handler func([]byte)) error {
	if s.log == nil {
		return errors.New("logger is not initialized")
	}

	if s.js == nil {
		return errors.New("JetStream client is not initialized")
	}

	consumerConfig := jetstream.ConsumerConfig{
		Durable:       fmt.Sprintf("%s-consumer", s.streamName),
		AckPolicy:     jetstream.AckExplicitPolicy,
		DeliverPolicy: jetstream.DeliverAllPolicy,
	}

	if subject != "" {
		consumerConfig.FilterSubject = subject
	}

	cons, err := s.js.CreateOrUpdateConsumer(ctx, s.streamName, consumerConfig)
	if err != nil {
		return fmt.Errorf("failed to create or update consumer (streamName: %s): %w", s.streamName, err)
	}
	s.log.Info("Consumer created or updated", map[string]interface{}{
		"streamName": s.streamName,
	})

	consContext, err := cons.Consume(func(msg jetstream.Msg) {
		s.log.Debug("Message received on", map[string]interface{}{
			"streamName": s.streamName,
			"subject":    msg.Subject(),
			"data":       string(msg.Data()), // Log the message data for debugging
		})
		handler(msg.Data())
		if err := msg.Ack(); err != nil {
			s.log.Error("Failed to acknowledge message", map[string]interface{}{
				"error": err.Error(),
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
		s.log.Info("Context cancelled, stopping consumer", nil)
		consContext.Stop()
	}()
	return nil
}
