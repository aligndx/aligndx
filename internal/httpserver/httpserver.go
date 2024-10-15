package httpserver

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"

	"os"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/jobs"
	"github.com/aligndx/aligndx/internal/jobs/handlers/workflow"
	"github.com/aligndx/aligndx/internal/logger"
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/spf13/cobra"
)

// StartHTTPServer starts the HTTP server with all required services and configurations
func StartHTTPServer(ctx context.Context, rootcmd *cobra.Command, cfg *config.Config, jobService jobs.JobServiceInterface, log *logger.LoggerWrapper) (*pocketbase.PocketBase, error) {
	app := pocketbase.New()

	log.Info("App started")

	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	app.OnAfterBootstrap().Add(func(e *core.BootstrapEvent) error {
		// Placeholder for post-bootstrap logic
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

		// Fetch workflow record ID and other details
		workflowRecordID := record.GetString("workflow")
		workflowRecord, err := app.Dao().FindRecordById("workflows", workflowRecordID)
		if err != nil {
			log.Error("Failed to fetch workflow record", map[string]interface{}{"error": err})
			return err
		}

		userID := e.HttpContext.Get(apis.ContextAuthRecordKey).(*models.Record).Id
		workflowRepo := workflowRecord.GetString("repository")
		schema := map[string]interface{}{}
		workflowRecord.UnmarshalJSONField("schema", &schema)

		workflowInputs := workflow.WorkflowInputs{
			Name:               record.GetString("name"),
			WorkflowRepository: workflowRepo,
			WorkflowSchema:     schema,
			Inputs:             result,
			JobID:              jobID,
			UserID:             userID,
		}

		queueErr := jobService.QueueJob(ctx, jobID, workflowInputs, "workflow")
		if queueErr != nil {
			log.Error("Failed to queue job", map[string]interface{}{"error": queueErr})
			return queueErr
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

			flusher, ok := w.Writer.(http.Flusher)
			if !ok {
				http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
				return nil
			}

			flusher.Flush()

			jobID := c.PathParam("jobId")
			if jobID == "" {
				return echo.NewHTTPError(http.StatusBadRequest, "Missing jobId parameter")
			}

			clientCtx := c.Request().Context()

			err := jobService.SubscribeToJob(clientCtx, jobID, func(msgData []byte) {
				fmt.Fprintf(w, "data: %s\n\n", msgData)
				flusher.Flush()
			})

			if err != nil {
				log.Error("Failed to subscribe to job updates", map[string]interface{}{"error": err})
				return err
			}

			<-clientCtx.Done()

			log.Info(fmt.Sprintf("SSE client disconnected, ip: %v", c.RealIP()))
			return nil
		})

		return nil
	})

	migratecmd.MustRegister(app, rootcmd, migratecmd.Config{
		Dir:         cfg.DB.MigrationsDir,
		Automigrate: isGoRun,
	})

	return app, nil
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

	if _, err := fmt.Fprintf(w, "data: %s\n\n", e.Data); err != nil {
		return err
	}

	return nil
}
