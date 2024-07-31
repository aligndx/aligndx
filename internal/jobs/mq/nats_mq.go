package mq

import (
	"time"

	"github.com/nats-io/nats.go"
)

type NATSMessageQueueService struct {
	conn *nats.Conn
}

func NewNATSMessageQueueService(url string) (*NATSMessageQueueService, error) {
	conn, err := nats.Connect(url)
	if err != nil {
		return nil, err
	}

	return &NATSMessageQueueService{conn: conn}, nil
}

func (s *NATSMessageQueueService) Publish(subject string, data []byte) error {
	return s.conn.Publish(subject, data)
}

func (s *NATSMessageQueueService) Subscribe(subject string) ([]byte, error) {
	sub, err := s.conn.SubscribeSync(subject)
	if err != nil {
		return nil, err
	}
	defer sub.Unsubscribe()

	msg, err := sub.NextMsg(time.Millisecond * 10)
	if err != nil {
		return nil, err
	}

	return msg.Data, nil
}
