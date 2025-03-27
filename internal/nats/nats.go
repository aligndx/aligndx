package nats

import (
	"context"
	"time"

	"github.com/aligndx/aligndx/internal/logger"
	"github.com/nats-io/nats-server/v2/server"
)

func StartNATSServer(ctx context.Context, blocking bool) error {
	log := logger.NewLoggerWrapper("zerolog", ctx)

	opts := &server.Options{
		JetStream: true,
	}

	log.Debug("Initializing NATS server", map[string]interface{}{"opts": opts})

	ns, err := server.NewServer(opts)
	if err != nil {
		log.Error("Failed to initialize NATS server", map[string]interface{}{"error": err})
		return err
	}

	// Start the NATS server in a goroutine
	go func() {
		log.Debug("Starting NATS server")
		ns.Start()
	}()

	// Wait for NATS to be ready for connections
	if !ns.ReadyForConnections(4 * time.Second) {
		log.Error("NATS server not ready for connections")
		return err
	}

	log.Debug("NATS server ready for connections")

	if blocking {
		// If blocking is true, block until the server is shut down
		ns.WaitForShutdown()
		log.Debug("NATS server has shut down")
	} else {
		// If non-blocking, handle shutdown using context cancellation
		go func() {
			<-ctx.Done() // Wait for the context cancellation
			log.Info("Shutting down NATS server")
			ns.Shutdown()
		}()
	}

	return nil
}
