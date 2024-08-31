package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/jobs"
	"github.com/aligndx/aligndx/internal/jobs/handlers/workflow"
	"github.com/aligndx/aligndx/internal/jobs/mq"
	"github.com/aligndx/aligndx/internal/logger"
	_ "github.com/aligndx/aligndx/internal/migrations"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
)

var log *logger.LoggerWrapper

func main() {
	ctx := context.Background()
	app := pocketbase.New()
	log = logger.NewLoggerWrapper("zerolog", ctx)
	configService := config.NewConfigService(log)
	cfg := configService.LoadConfig()

	log.Info("App started")

	mqService, err := mq.NewJetStreamMessageQueueService(ctx, cfg.MQ.URL, cfg.MQ.Stream, "jobs.>", log)
	if err != nil {
		log.Fatal("Failed to initialize message queue service", map[string]interface{}{"error": err})
		return
	}
	jobService := jobs.NewJobService(mqService, log, cfg, cfg.MQ.Stream, "jobs")

	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	app.OnAfterBootstrap().Add(func(e *core.BootstrapEvent) error {
		// configService.SetPBSettings(app)
		return nil
	})

	app.OnRecordAfterCreateRequest("submissions").Add(func(e *core.RecordCreateEvent) error {
		record := e.Record
		jobID := e.Record.Id

		result := map[string]interface{}{}
		record.UnmarshalJSONField("inputs", &result)
		if err != nil {
			log.Error("Failed to unmarshal inputs field", map[string]interface{}{"error": err})
			return err
		}

		// Fetch workflow record ID and other details
		workflowRecordID := record.GetString("workflow")
		workflowRecord, err := app.Dao().FindRecordById("workflows", workflowRecordID)
		if err != nil {
			log.Error("Failed to fetch workflow record", map[string]interface{}{"error": err})
			return err
		}

		userID := e.HttpContext.Get(apis.ContextAuthRecordKey).(*models.Record).Id

		workflowRepo := workflowRecord.GetString("repository")
		workflowInputs := workflow.WorkflowInputs{
			Name:     record.GetString("name"),
			Workflow: workflowRepo,
			Inputs:   result,
			JobID:    jobID,
			UserID:   userID,
		}

		queue_err := jobService.QueueJob(ctx, jobID, workflowInputs, "workflow")
		if queue_err != nil {
			log.Error("Failed to queue job", map[string]interface{}{"error": err})
			return err
		}

		log.Info(fmt.Sprintf("Job %s successfully queued", jobID))

		return nil
	})

	// app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
	// 	e.Router.GET("/jobs/subscribe/:jobId", func(c echo.Context) error {
	// 		log.Debug(fmt.Sprintf("SSE client connected, ip: %v", c.RealIP()))
	// 		w := c.Response()

	// 		// Set necessary headers for SSE
	// 		w.Header().Set("Content-Type", "text/event-stream")
	// 		w.Header().Set("Cache-Control", "no-cache")
	// 		w.Header().Set("Connection", "keep-alive")

	// 		// Flush headers to establish SSE connection
	// 		flusher, ok := w.Writer.(http.Flusher)
	// 		if !ok {
	// 			http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
	// 			return nil
	// 		}

	// 		// Get jobId from URL parameters
	// 		jobID := c.PathParam("jobId")
	// 		if jobID == "" {
	// 			http.Error(w, "Missing jobId parameter", http.StatusBadRequest)
	// 			return nil
	// 		}

	// 		// Create a channel to send updates
	// 		updateChan := make(chan []byte)
	// 		clientCtx, cancel := context.WithCancel(c.Request().Context())

	// 		// Subscribe to job updates in a separate goroutine
	// 		go func() {
	// 			defer close(updateChan)
	// 			err := jobService.SubscribeToJob(clientCtx, jobID, func(msgData []byte) {
	// 				select {
	// 				case updateChan <- msgData:
	// 				case <-clientCtx.Done():
	// 					// Stop sending updates if the client disconnects
	// 					log.Info(fmt.Sprintf("Client disconnected, stopping subscription for jobID: %s", jobID))
	// 					return
	// 				}
	// 			})
	// 			if err != nil {
	// 				log.Error("Failed to subscribe to job updates", map[string]interface{}{"error": err})
	// 				cancel() // Cancel the context if subscription fails
	// 			}
	// 		}()

	// 		for {
	// 			select {
	// 			case msgData, ok := <-updateChan:
	// 				if !ok {
	// 					// Channel closed, stop streaming
	// 					return nil
	// 				}
	// 				_, err := fmt.Fprintf(w, "data: %s\n\n", string(msgData))
	// 				if err != nil {
	// 					log.Error("Error writing to SSE client", map[string]interface{}{"error": err})
	// 					cancel() // Stop if there is an error writing to the client
	// 					return nil
	// 				}
	// 				flusher.Flush() // Ensure the data is sent to the client

	// 			case <-clientCtx.Done():
	// 				// Handle client disconnection
	// 				log.Info(fmt.Sprintf("Client context canceled, stopping SSE stream for jobID: %s", jobID))
	// 				return nil
	// 			}
	// 		}
	// 	})
	// 	return nil
	// })

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		// enable auto creation of migration files when making collection changes in the Admin UI
		// (the isGoRun check is to enable it only during development)
		Dir:         cfg.DB.MigrationsDir, // path to migration files
		Automigrate: isGoRun,
	})

	if err := app.Start(); err != nil {
		log.Fatal("Error starting the application", map[string]interface{}{"error": err})
	}
}

func handleJobSubscription(ctx context.Context, jobService *jobs.JobService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get jobId from URL
		jobID := r.URL.Query().Get("jobId")
		if jobID == "" {
			http.Error(w, "Missing jobId parameter", http.StatusBadRequest)
			return
		}

		// Set necessary headers for SSE
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		// Create a channel to send updates
		updateChan := make(chan []byte)

		// Subscribe to job updates
		go func() {
			err := jobService.SubscribeToJob(ctx, jobID, func(msgData []byte) {
				updateChan <- msgData
			})
			if err != nil {
				log.Error("Failed to subscribe to job updates", map[string]interface{}{"error": err})
				close(updateChan)
				return
			}
		}()

		// Stream updates to the client
		for {
			select {
			case msgData, ok := <-updateChan:
				if !ok {
					// Channel closed, stop streaming
					return
				}
				fmt.Fprintf(w, "data: %s\n\n", string(msgData))
				w.(http.Flusher).Flush() // Flush the data to the client
			case <-r.Context().Done():
				// Client disconnected
				log.Info(fmt.Sprintf("Client disconnected from job %s updates", jobID))
				return
			}
		}
	}
}
