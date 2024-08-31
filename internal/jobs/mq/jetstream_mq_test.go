package mq

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

// SetupNATSContainer sets up a NATS container for testing
func SetupNATSContainer(ctx context.Context) (testcontainers.Container, string, error) {
	req := testcontainers.ContainerRequest{
		Image:        "nats:latest",
		ExposedPorts: []string{"4222/tcp"},
		Cmd:          []string{"-js"},
		WaitingFor:   wait.ForListeningPort("4222/tcp"),
	}

	natsContainer, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		return nil, "", err
	}

	ip, err := natsContainer.Host(ctx)
	if err != nil {
		return nil, "", err
	}

	port, err := natsContainer.MappedPort(ctx, "4222")
	if err != nil {
		return nil, "", err
	}

	url := fmt.Sprintf("nats://%s:%s", ip, port.Port())
	return natsContainer, url, nil
}

func TestNewJetStreamMessageQueueService(t *testing.T) {
	ctx := context.Background()

	// Setup NATS container
	natsContainer, url, err := SetupNATSContainer(ctx)
	require.NoError(t, err, "Failed to setup NATS container")
	defer natsContainer.Terminate(ctx)

	// Define test scenarios
	type scenario struct {
		streamName  string
		subjectName string
		expectedErr string
	}

	scenarios := []scenario{
		{streamName: "test_stream", subjectName: "test_subject", expectedErr: ""},
		// Add more scenarios if needed for various streams and subjects, including error cases
	}

	// Execute each test scenario
	for _, sc := range scenarios {
		t.Run(fmt.Sprintf("%s_%s", sc.streamName, sc.subjectName), func(t *testing.T) {
			_, err := NewJetStreamMessageQueueService(ctx, url, sc.streamName, sc.subjectName, nil)
			if sc.expectedErr != "" {
				assert.ErrorContains(t, err, sc.expectedErr, "Service creation should fail")
			} else {
				assert.NoError(t, err, "Failed to create JetStream service")
			}
		})
	}
}

func TestPublishAndSubscribe(t *testing.T) {
	ctx := context.Background()
	natsContainer, url, err := SetupNATSContainer(ctx)
	require.NoError(t, err, "Failed to start NATS container")
	defer natsContainer.Terminate(ctx)

	type testScenario struct {
		description  string
		stream       string
		subject      string
		msgData      []byte
		expectedData []byte
		timeout      time.Duration
	}

	scenarios := []testScenario{
		{
			description:  "Job Specific Events",
			stream:       "jobs",
			subject:      fmt.Sprintf("jobs.%s.events", "12345"),
			msgData:      []byte("job event"),
			expectedData: []byte("job event"),
			timeout:      10 * time.Second,
		},
		{
			description:  "Standard Subject",
			stream:       "test",
			subject:      "test.test",
			msgData:      []byte("hello world"),
			expectedData: []byte("hello world"),
			timeout:      10 * time.Second,
		},
	}

	for _, sc := range scenarios {
		t.Run(sc.description, func(t *testing.T) {
			service, err := NewJetStreamMessageQueueService(ctx, url, sc.stream, sc.subject, nil)
			require.NoError(t, err, "Failed to create JetStream service")

			// Set up a subscriber
			received := make(chan []byte)
			handler := func(msg []byte) {
				received <- msg
			}

			err = service.Subscribe(ctx, "", handler)
			require.NoError(t, err, "Failed to subscribe")

			// Publish a message
			err = service.Publish(ctx, sc.subject, sc.msgData)
			require.NoError(t, err, "Failed to publish message")

			select {
			case data := <-received:
				assert.Equal(t, sc.expectedData, data, "Mismatch in sent and received message data")
			case <-time.After(sc.timeout):
				t.Errorf("Timed out waiting for message")
			}
		})
	}
}
