package workflow

type WorkflowInputs struct {
	Name       string                 `json:"name"`
	Repository string                 `json:"repository"`
	Schema     map[string]interface{} `json:"schema"`
	Inputs     map[string]interface{} `json:"inputs"`
	JobID      string                 `json:"jobid"`
	UserID     string                 `json:"userid"`
}
