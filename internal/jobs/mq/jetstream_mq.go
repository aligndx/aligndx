package mq

import (
	"context"
	"fmt"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

type JetStreamMessageQueueService struct {
	js         jetstream.JetStream
	streamName string
}

func NewJetStreamMessageQueueService(url string, streamName string, subject string) (*JetStreamMessageQueueService, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	nc, err := nats.Connect(url)
	if err != nil {
		return nil, err
	}

	js, err := jetstream.New(nc)
	if err != nil {
		return nil, err
	}

	// Declare the stream
	cfg := jetstream.StreamConfig{
		Name:      streamName,
		Retention: jetstream.WorkQueuePolicy,
		Subjects:  []string{subject},
		Storage:   jetstream.FileStorage,
	}

	_, err = js.CreateStream(ctx, cfg)
	if err != nil {
		return nil, err
	}

	return &JetStreamMessageQueueService{js: js, streamName: streamName}, nil
}

func (s *JetStreamMessageQueueService) Publish(ctx context.Context, subject string, data []byte) error {
	_, err := s.js.Publish(ctx, subject, data)
	if err != nil {
		return err
	}

	return nil
}

func (s *JetStreamMessageQueueService) Subscribe(ctx context.Context, handler func(msg jetstream.Msg)) error {
	consumerConfig := jetstream.ConsumerConfig{
		Durable:       fmt.Sprintf("%s-consumer", s.streamName),
		AckPolicy:     jetstream.AckExplicitPolicy,
		DeliverPolicy: jetstream.DeliverAllPolicy,
	}

	cons, err := s.js.CreateOrUpdateConsumer(ctx, s.streamName, consumerConfig)
	if err != nil {
		return err
	}

	consContext, err := cons.Consume(handler)
	if err != nil {
		return err
	}
	go func() {
		<-ctx.Done()
		consContext.Stop()
	}()
	return nil
}
