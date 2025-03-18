package pb

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/aligndx/aligndx/internal/config"
	"github.com/aligndx/aligndx/internal/jobs"
	"github.com/aligndx/aligndx/internal/jobs/handlers/workflow"
	"github.com/aligndx/aligndx/internal/jobs/mq"
	"github.com/aligndx/aligndx/internal/logger"
	"github.com/pocketbase/dbx"
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

	pb.OnRecordCreateRequest("submissions").BindFunc(func(e *core.RecordRequestEvent) error {
		record := e.Record
		jobID := e.Record.Id
		userID := e.Auth.Id

		result := map[string]interface{}{}
		record.UnmarshalJSONField("params", &result)
		workflowRecordID := record.GetString("workflow")

		type Workflow struct {
			Id         string                 `db:"id" json:"id"`
			Name       string                 `db:"name" json:"name"`
			Repository string                 `db:"repostiory" json:"repository"`
			Schema     map[string]interface{} `db:"schema" json:"schema"`
		}

		workflowRecord := Workflow{}
		var schemaStr string

		query := e.App.DB().
			Select("schema", "repository").
			From("workflows").
			Where(dbx.NewExp("id = {:id}", dbx.Params{"id": workflowRecordID}))

		// Execute the query and populate the variables
		err := query.One(&struct {
			SchemaStr  *string `db:"schema"`
			Repository *string `db:"repository"`
		}{
			SchemaStr:  &schemaStr,
			Repository: &workflowRecord.Repository,
		})
		if err != nil {
			return err
		}

		// Use the retrieved data to create a WorkflowInputs object
		workflowInputs := workflow.WorkflowInputs{
			Name:               record.GetString("name"),
			WorkflowRepository: workflowRecord.Repository,
			WorkflowSchema:     workflowRecord.Schema,
			Inputs:             result,
			JobID:              jobID,
			UserID:             userID,
		}

		queueErr := jobService.QueueJob(ctx, jobID, workflowInputs, "workflow")
		if queueErr != nil {
			return queueErr
		}
		return e.Next()
	})

	pb.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.GET("/jobs/subscribe/:jobId", func(e *core.RequestEvent) error {
			jobID := e.Request.PathValue("jobId")
			if jobID == "" {
				http.Error(e.Response, "jobID is required", http.StatusBadRequest)
				return nil
			}
			sseHandler(e.Response, e.Request, jobService)
			return nil
		})
		return se.Next()
	})
	return nil
}

func sseHandler(w http.ResponseWriter, r *http.Request, jobService jobs.JobServiceInterface) {
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

	// Retrieve jobID from query parameters (adjust as needed)
	jobID := r.URL.Query().Get("jobID")
	if jobID == "" {
		http.Error(w, "jobID is required", http.StatusBadRequest)
		return
	}

	// Subscribe to job events; jobService.SubscribeToJob should invoke the callback with new messages.
	err := jobService.SubscribeToJob(clientCtx, jobID, func(msgData []byte) {
		// Write SSE data to the response in the required format
		fmt.Fprintf(w, "data: %s\n\n", msgData)
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

	// Initialize message queue service
	mqService, err := mq.NewJetStreamMessageQueueService(ctx, cfg.MQ.URL, cfg.MQ.Stream, "jobs.>", log)
	if err != nil {
		log.Fatal("Failed to initialize message queue service", map[string]interface{}{"error": err})
		return err
	}

	// Initialize job service
	jobService := jobs.NewJobService(mqService, log, cfg, cfg.MQ.Stream, "jobs")

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
