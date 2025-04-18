package pb

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	_ "github.com/aligndx/aligndx/internal/migrations"
	"github.com/nats-io/nats.go/jetstream"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/jobs"
	"github.com/aligndx/aligndx/internal/jobs/handlers/workflow"
	"github.com/aligndx/aligndx/internal/logger"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/cmd"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/spf13/cobra"
)

func CreatePbApp(rootcmd *cobra.Command) (*pocketbase.PocketBase, error) {
	configManager := config.NewConfigManager()
	cfg := configManager.GetConfig()
	app := pocketbase.New()
	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	migratecmd.MustRegister(app, rootcmd, migratecmd.Config{
		Dir:         cfg.DB.MigrationsDir,
		Automigrate: isGoRun,
	})
	rootcmd.AddCommand(cmd.NewSuperuserCommand(app))

	app.Bootstrap()

	return app, nil
}

func ConfigurePbApp(ctx context.Context, pb *pocketbase.PocketBase, cfg *config.Config, jobService jobs.JobServiceInterface) error {
	pb.OnRecordCreateRequest("submissions").BindFunc(func(e *core.RecordRequestEvent) error {
		e.Record.Set("status", string(jobs.StatusCreated))
		return e.Next()
	})

	pb.OnServe().BindFunc(func(e *core.ServeEvent) error {
		subject := "status.*"
		consumerName := "job-status-updater"
		err := jobService.Subscribe(ctx, subject, consumerName, func(msg jetstream.Msg) {
			var event jobs.Event[jobs.StatusEventMetadata]
			if err := json.Unmarshal(msg.Data(), &event); err != nil {
				pb.App.Logger().Error(err.Error())
				return
			}
			record, err := e.App.FindRecordById("submissions", event.MetaData.JobID)
			if err != nil {
				pb.App.Logger().Error(err.Error())
				return
			}
			record.Set("status", string(event.MetaData.Status))
			if err = e.App.Save(record); err != nil {
				pb.App.Logger().Error(err.Error())
				return
			}
		})

		if err != nil {
			return err
		}

		return e.Next()
	})

	pb.OnRecordAfterCreateSuccess("submissions").BindFunc(func(e *core.RecordEvent) error {
		record := e.Record
		jobID := e.Record.Id
		userID := record.GetString("user")

		result := map[string]interface{}{}
		record.UnmarshalJSONField("params", &result)
		workflowRecordID := record.GetString("workflow")

		workflowRecord, err := e.App.FindRecordById("workflows", workflowRecordID)

		if err != nil {
			return err
		}

		var schema map[string]interface{}
		if err := workflowRecord.UnmarshalJSONField("schema", &schema); err != nil {
			return err
		}
		// Use the retrieved data to create a WorkflowInputs object
		workflowInputs := workflow.WorkflowInputs{
			Name:       record.GetString("name"),
			Repository: workflowRecord.GetString("repository"),
			Schema:     schema,
			Inputs:     result,
			JobID:      jobID,
			UserID:     userID,
		}

		queueErr := jobService.Queue(ctx, jobID, workflowInputs, "workflow")
		if queueErr != nil {
			return queueErr
		}
		return e.Next()
	})

	pb.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.GET("/jobs/subscribe/{jobId}", func(e *core.RequestEvent) error {
			jobID := e.Request.PathValue("jobId")
			if jobID == "" {
				http.Error(e.Response, "jobID is required", http.StatusBadRequest)
				return nil
			}
			sseHandler(e.Response, e.Request, jobService, jobID)
			return nil
		})
		return se.Next()
	})
	return nil
}

func sseHandler(w http.ResponseWriter, r *http.Request, jobService jobs.JobServiceInterface, jobID string) {
	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	// Ensure the ResponseWriter supports flushing
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	// Use the request's context so that the subscription cancels when the client disconnects
	clientCtx := r.Context()
	if jobID == "" {
		http.Error(w, "jobID is required", http.StatusBadRequest)
		return
	}

	subject := fmt.Sprintf("%s.>", jobID)

	// Subscribe to job events; jobService.SubscribeToJob should invoke the callback with new messages.
	err := jobService.ReplaySubscribe(clientCtx, subject, func(msg jetstream.Msg) {
		// Write SSE data to the response in the required format
		fmt.Fprintf(w, "data: %s\n\n", msg.Data())
		// Flush the data immediately so it reaches the client
		flusher.Flush()
	})

	if err != nil {
		// Handle subscription error
		fmt.Fprintf(w, "event: error\ndata: %s\n\n", err.Error())
		flusher.Flush()
		return
	}

	// Optionally block until the client disconnects.
	<-clientCtx.Done()
}

func StartPBServer(ctx context.Context, pb *pocketbase.PocketBase, args []string, allowedOrigins []string, httpAddr string, httpsAddr string, showStartBanner bool) error {
	log := logger.NewLoggerWrapper("zerolog", ctx)

	configManager := config.NewConfigManager()
	cfg := configManager.GetConfig()

	// Initialize job service
	jobService, err := jobs.NewJobService(ctx, log, cfg)
	if err != nil {
		log.Fatal("Failed to setup job service", map[string]interface{}{"error": err})
		return err
	}

	err = ConfigurePbApp(ctx, pb, cfg, jobService)
	if err != nil {
		log.Fatal("Failed to configure HTTP server", map[string]interface{}{"error": err})
		return err
	}

	if len(args) > 0 {
		if httpAddr == "" {
			httpAddr = "0.0.0.0:80"
		}
		if httpsAddr == "" {
			httpsAddr = "0.0.0.0:443"
		}
	} else {
		if httpAddr == "" {
			httpAddr = "127.0.0.1:8090"
		}
	}

	err = apis.Serve(pb, apis.ServeConfig{
		HttpAddr:           httpAddr,
		HttpsAddr:          httpsAddr,
		ShowStartBanner:    showStartBanner,
		AllowedOrigins:     allowedOrigins,
		CertificateDomains: args,
	})

	if errors.Is(err, http.ErrServerClosed) {
		return nil
	}

	return err

}
