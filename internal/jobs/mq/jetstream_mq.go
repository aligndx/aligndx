package jobs

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

type JetStreamMessageQueueService struct {
	js jetstream.JetStream
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
		Subjects:  []string{fmt.Sprintf("%s.>", subject)},
	}

	_, err = js.CreateStream(ctx, cfg)
	if err != nil {
		return nil, err
	}

	return &JetStreamMessageQueueService{js: js}, nil
}

func (s *JetStreamMessageQueueService) Publish(subject string, data []byte) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	ack, err := s.js.Publish(ctx, subject, data)
	if err != nil {
		return err
	}

	// Ensure the message was published successfully
	if ack.Stream != "" {
		fmt.Printf("Published to stream: %s, seq: %d\n", ack.Stream, ack.Sequence)
	}

	return nil
}

func (s *JetStreamMessageQueueService) Subscribe(subject string, handler func(msg *jetstream.Msg)) error {
	sub, err := s.js.PullSubscribe(subject, jetstream.PullDefault())
	if err != nil {
		return err
	}

	go func() {
		for {
			msgs, err := sub.Fetch(10)
			if err != nil {
				log.Printf("Error fetching messages: %v", err)
				time.Sleep(time.Second)
				continue
			}
			for _, msg := range msgs {
				handler(msg)
				msg.Ack()
			}
		}
	}()

	return nil
}
