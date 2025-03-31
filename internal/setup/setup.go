package setup

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/charmbracelet/bubbles/spinner"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// Style for the main output, applying a left margin for better formatting.
var mainStyle = lipgloss.NewStyle().MarginLeft(1)

var workflowsDir = "workflows"

// taskResult stores the outcome of a task.
// - description: The name of the task.
// - done: Whether the task is completed.
// - err: Any error that occurred during the task.
type taskResult struct {
	description string
	done        bool
	err         error
}

// model defines the state of the program during execution.
type model struct {
	spinner     spinner.Model // Spinner for indicating ongoing tasks.
	results     []taskResult  // List of results for each task.
	quitting    bool          // Whether the program is exiting.
	currentStep int           // Index of the current task being processed.
	steps       []struct {    // List of tasks to execute.
		desc string       // Task description.
		task func() error // Task function to execute.
	}
}

// newModel initializes a new program model with the provided steps.
func newModel(steps []struct {
	desc string
	task func() error
}) model {
	sp := spinner.New()                                              // Create a new spinner.
	sp.Style = lipgloss.NewStyle().Foreground(lipgloss.Color("206")) // Set spinner color.
	return model{
		spinner: sp,
		results: make([]taskResult, len(steps)), // Initialize empty results for each step.
		steps:   steps,
	}
}

// Init sets up the initial commands to run (start spinner and first task).
func (m model) Init() tea.Cmd {
	return tea.Batch(
		m.spinner.Tick,                  // Start the spinner.
		runTask(m.steps[m.currentStep]), // Execute the first task.
	)
}

// Update processes incoming messages and updates the model state accordingly.
func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		// Handle quitting when a key is pressed.
		m.quitting = true
		return m, tea.Quit

	case spinner.TickMsg:
		// Update the spinner animation.
		var cmd tea.Cmd
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd

	case taskResult:
		// Store the result of the current task.
		m.results[m.currentStep] = msg
		m.currentStep++ // Move to the next task.

		if m.currentStep >= len(m.steps) {
			// If all tasks are completed, exit.
			m.quitting = true
			return m, tea.Quit
		}

		// Start the next task and continue the spinner.
		return m, tea.Batch(
			m.spinner.Tick,
			runTask(m.steps[m.currentStep]),
		)

	default:
		// For any other messages, no action is taken.
		return m, nil
	}
}

// View renders the current state of the program for display.
func (m model) View() string {
	var s string
	hasError := false
	for i, step := range m.steps {
		if i < m.currentStep {
			// Display completed tasks with a checkmark or error.
			if m.results[i].err != nil {
				hasError = true
				s += fmt.Sprintf("❌ %s\n", step.desc)
			} else {
				s += fmt.Sprintf("✔️ %s\n", step.desc)
			}
		} else if i == m.currentStep {
			// Display the current task with a spinner.
			s += fmt.Sprintf("%s %s\n", m.spinner.View(), step.desc)
		} else {
			// Display pending tasks with a dash.
			s += fmt.Sprintf("- %s\n", step.desc)
		}
	}

	if m.quitting {
		if hasError {
			s += "\nSetup failed!\n"
		} else {
			s += "\nSetup complete!\n"
		}
	}

	return mainStyle.Render(s)
}

// createWorkflowFolder creates the required folder structure for the workflow.
func createWorkflowFolder() error {
	currentDir, err := os.Getwd() // Get the current working directory.
	if err != nil {
		return fmt.Errorf("unable to determine current directory: %v", err)
	}

	workflowDir := filepath.Join(currentDir, "pb_data", workflowsDir) // Target folder path.
	return os.MkdirAll(workflowDir, 0755)                             // Create folder with permissions.
}

// checkJava checks if Java is installed by running "java -version".
func checkJava() error {
	cmd := exec.Command("java", "-version")
	return cmd.Run()
}

// checkDocker checks if Docker is running by executing "docker info".
func checkDocker() error {
	cmd := exec.Command("docker", "info")
	return cmd.Run()
}

// installNextflow downloads and installs Nextflow in the workflow folder.
func installNextflow() error {
	currentDir, err := os.Getwd() // Get the current working directory.
	if err != nil {
		return fmt.Errorf("unable to determine current directory: %v", err)
	}
	workflowDir := filepath.Join(currentDir, "pb_data", workflowsDir)
	nextflowPath := filepath.Join(workflowDir, "nextflow")

	// Check if Nextflow is already installed.
	if _, err := os.Stat(nextflowPath); err == nil {
		return nil
	}

	// Download and install Nextflow.
	cmd := exec.Command("bash", "-c", fmt.Sprintf("curl -s https://get.nextflow.io | bash && mv nextflow %s", workflowDir))
	return cmd.Run()
}

// runTask executes a single task and returns the result as a message.
func runTask(step struct {
	desc string
	task func() error
}) tea.Cmd {
	return func() tea.Msg {
		err := step.task() // Run the task function.
		return taskResult{description: step.desc, done: true, err: err}
	}
}

// isSetupComplete checks if all setup steps have passed.
func isSetupComplete() bool {
	// Get current working directory.
	currentDir, err := os.Getwd()
	if err != nil {
		return false
	}
	workflowDir := filepath.Join(currentDir, "pb_data", workflowsDir)

	// Check if workflow folder exists.
	if _, err := os.Stat(workflowDir); os.IsNotExist(err) {
		return false
	}

	// Check if Java is available.
	if err := checkJava(); err != nil {
		return false
	}

	// Check if Docker is running.
	if err := checkDocker(); err != nil {
		return false
	}

	// Check if Nextflow is installed.
	nextflowPath := filepath.Join(workflowDir, "nextflow")
	if _, err := os.Stat(nextflowPath); os.IsNotExist(err) {
		return false
	}

	return true
}

// Setup runs the setup tasks if they haven't been completed.
// Setup runs the setup tasks if they haven't been completed.
func Setup() error {
	if isSetupComplete() {
		fmt.Println("All setup steps have already been completed, skipping setup.")
		return nil
	}

	steps := []struct {
		desc string
		task func() error
	}{
		{"Creating workflow folder", createWorkflowFolder},
		{"Checking for Java", checkJava},
		{"Checking for Docker", checkDocker},
		{"Installing Nextflow", installNextflow},
	}

	m := newModel(steps)
	program := tea.NewProgram(m)

	// Run the program.
	finalModel, err := program.Run()
	if err != nil {
		return err
	}

	// Type assert the final model to our model type.
	final, ok := finalModel.(model)
	if !ok {
		return fmt.Errorf("unexpected final model type")
	}

	// Check each task's result; if any failed, return an error.
	for _, result := range final.results {
		if result.err != nil {
			return fmt.Errorf("setup step '%s' failed: %v", result.description, result.err)
		}
	}

	return nil
}
