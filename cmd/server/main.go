package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/jobs"
	"github.com/aligndx/aligndx/internal/jobs/handlers/workflow"
	"github.com/aligndx/aligndx/internal/jobs/mq"
	"github.com/aligndx/aligndx/internal/logger"
	_ "github.com/aligndx/aligndx/internal/migrations"
	"github.com/labstack/echo/v5"
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

	app.OnRecordBeforeCreateRequest("submissions").Add(func(e *core.RecordCreateEvent) error {
		e.Record.Set("status", string(jobs.StatusCreated))
		return nil
	})

	app.OnRecordAfterCreateRequest("submissions").Add(func(e *core.RecordCreateEvent) error {
		admin, _ := e.HttpContext.Get(apis.ContextAdminKey).(*models.Admin)
		if admin != nil {
			return nil // ignore for admins
		}
		record := e.Record
		jobID := e.Record.Id

		result := map[string]interface{}{}
		record.UnmarshalJSONField("params", &result)
		if err != nil {
			log.Error("Failed to unmarshal params field", map[string]interface{}{"error": err})
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

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.GET("/jobs/subscribe/:jobId", func(c echo.Context) error {
			log.Debug(fmt.Sprintf("SSE client connected, ip: %v", c.RealIP()))

			// Set necessary headers for SSE
			w := c.Response()
			w.Header().Set("Content-Type", "text/event-stream")
			w.Header().Set("Cache-Control", "no-cache")
			w.Header().Set("Connection", "keep-alive")

			// Get the flusher interface
			flusher, ok := w.Writer.(http.Flusher)
			if !ok {
				http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
				return nil
			}

			// Immediately flush headers to establish connection
			flusher.Flush()

			// Get jobId from URL parameters
			jobID := c.PathParam("jobId")
			if jobID == "" {
				return echo.NewHTTPError(http.StatusBadRequest, "Missing jobId parameter")
			}

			// Create a context that will be canceled when the client disconnects
			clientCtx := c.Request().Context()

			// Subscribe to job updates using the simplified logic
			err := jobService.SubscribeToJob(clientCtx, jobID, func(msgData []byte) {
				// Stream data to SSE client
				fmt.Fprintf(w, "data: %s\n\n", msgData)
				flusher.Flush() // Ensure the data is sent immediately
			})

			if err != nil {
				log.Error("Failed to subscribe to job updates", map[string]interface{}{"error": err})
				return err
			}

			<-clientCtx.Done() // Wait for client to disconnect or context cancellation

			log.Info(fmt.Sprintf("SSE client disconnected, ip: %v", c.RealIP()))
			return nil
		})

		return nil
	})

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

// Event represents a Server-Sent Event (SSE) message
type Event struct {
	Data []byte
	ID   string
	Name string
}

// MarshalTo writes the Event to an io.Writer in the SSE format
func (e *Event) MarshalTo(w io.Writer) error {
	if e.Name != "" {
		if _, err := fmt.Fprintf(w, "event: %s\n", e.Name); err != nil {
			return err
		}
	}

	if e.ID != "" {
		if _, err := fmt.Fprintf(w, "id: %s\n", e.ID); err != nil {
			return err
		}
	}

	// Writing data line by line as per SSE format
	if _, err := fmt.Fprintf(w, "data: %s\n\n", e.Data); err != nil {
		return err
	}

	return nil
}
