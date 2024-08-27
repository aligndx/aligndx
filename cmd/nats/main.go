package main

import (
	"context"
	"time"

	"github.com/aligndx/aligndx/internal/logger"
	"github.com/nats-io/nats-server/v2/server"
)

func main() {
	ctx := context.Background()
	log := logger.NewLoggerWrapper("zerolog", ctx)

	opts := &server.Options{
		JetStream: true,
	}

	log.Debug("Initializing NATS server with options", map[string]interface{}{
		"opts": opts,
	})

	// Initialize new server with options
	ns, err := server.NewServer(opts)
	if err != nil {
		log.Fatal("Failed to initialize NATS server", map[string]interface{}{
			"error": err.Error(),
		})
		panic(err)
	}

	log.Debug("NATS server initialized successfully")

	// Start the server via goroutine
	go func() {
		log.Info("Starting NATS server")
		ns.Start()
	}()

	// Wait for server to be ready for connections
	if !ns.ReadyForConnections(4 * time.Second) {
		log.Fatal("NATS server is not ready for connections", map[string]interface{}{
			"timeout": 4 * time.Second,
		})
		panic("not ready for connection")
	}

	log.Info("NATS server is ready for connections")

	// Wait for server shutdown
	ns.WaitForShutdown()

	log.Info("NATS server has shut down")
}
