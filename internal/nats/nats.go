package nats

import (
	"context"
	"time"

	"github.com/aligndx/aligndx/internal/logger"
	"github.com/nats-io/nats-server/v2/server"
)

func StartNATSServer(ctx context.Context) error {
	log := logger.NewLoggerWrapper("zerolog", ctx)

	opts := &server.Options{
		JetStream: true,
	}

	log.Debug("Initializing NATS server", map[string]interface{}{"opts": opts})

	ns, err := server.NewServer(opts)
	if err != nil {
		log.Fatal("Failed to initialize NATS server", map[string]interface{}{"error": err})
		return err
	}

	go func() {
		log.Info("Starting NATS server")
		ns.Start()
	}()

	if !ns.ReadyForConnections(4 * time.Second) {
		log.Fatal("NATS server not ready for connections")
		return err
	}

	log.Info("NATS server ready for connections")
	ns.WaitForShutdown()

	log.Info("NATS server has shut down")
	return nil
}
