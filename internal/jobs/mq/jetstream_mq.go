package mq

import (
	"context"
	"fmt"
	"time"

	"github.com/aligndx/aligndx/internal/logger"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

type JetStreamMessageQueueService struct {
	js         jetstream.JetStream
	streamName string
	log        *logger.LoggerWrapper
}

func NewJetStreamMessageQueueService(url string, streamName string, subject string, log *logger.LoggerWrapper) (*JetStreamMessageQueueService, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	nc, err := nats.Connect(url)
	if err != nil {
		log.Error("Failed to connect to NATS server", map[string]interface{}{
			"url":   url,
			"error": err,
		})
		return nil, err
	}
	log.Info("Connected to NATS server", map[string]interface{}{
		"url": url,
	})

	js, err := jetstream.New(nc)
	if err != nil {
		log.Error("Failed to initialize JetStream", map[string]interface{}{
			"error": err,
		})
		return nil, err
	}
	log.Info("JetStream initialized", nil)

	// Declare the stream
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
		return nil, err
	}
	log.Info("Stream created", map[string]interface{}{
		"streamName": streamName,
		"subject":    subject,
	})

	return &JetStreamMessageQueueService{js: js, streamName: streamName}, nil
}

func (s *JetStreamMessageQueueService) Publish(ctx context.Context, subject string, data []byte) error {
	_, err := s.js.Publish(ctx, subject, data)
	if err != nil {
		s.log.Error("Failed to publish message", map[string]interface{}{
			"subject": subject,
			"error":   err,
		})
		return err
	}

	s.log.Info("Message published", map[string]interface{}{
		"subject": subject,
	})
	return nil
}

func (s *JetStreamMessageQueueService) Subscribe(ctx context.Context, handler func([]byte)) error {
	consumerConfig := jetstream.ConsumerConfig{
		Durable:       fmt.Sprintf("%s-consumer", s.streamName),
		AckPolicy:     jetstream.AckExplicitPolicy,
		DeliverPolicy: jetstream.DeliverAllPolicy,
	}

	cons, err := s.js.CreateOrUpdateConsumer(ctx, s.streamName, consumerConfig)
	if err != nil {
		s.log.Error("Failed to create or update consumer", map[string]interface{}{
			"streamName": s.streamName,
			"error":      err,
		})
		return err
	}
	s.log.Info("Consumer created or updated", map[string]interface{}{
		"streamName": s.streamName,
	})

	consContext, err := cons.Consume(func(msg jetstream.Msg) {
		s.log.Info("Message received", map[string]interface{}{
			"streamName": s.streamName,
		})
		handler(msg.Data())
		err := msg.Ack()
		if err != nil {
			s.log.Error("Failed to acknowledge message", map[string]interface{}{
				"error": err,
			})
		} else {
			s.log.Info("Message acknowledged", nil)
		}
	})
	if err != nil {
		s.log.Error("Failed to start consuming messages", map[string]interface{}{
			"error": err,
		})
		return err
	}

	go func() {
		<-ctx.Done()
		s.log.Info("Context cancelled, stopping consumer", nil)
		consContext.Stop()
	}()
	return nil
}
