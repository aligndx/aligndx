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
	for i, step := range m.steps {
		if i < m.currentStep {
			// Display completed tasks with a checkmark or error.
			if m.results[i].err != nil {
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
		// Display a completion message when exiting.
		s += "\nSetup complete!\n"
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

// Setup defines the list of setup steps and runs the program.
func Setup() error {
	steps := []struct {
		desc string
		task func() error
	}{
		{"Creating workflow folder", createWorkflowFolder},
		{"Checking for Java", checkJava},
		{"Checking for Docker", checkDocker},
		{"Installing Nextflow", installNextflow},
	}

	// Initialize the program model with steps.
	m := newModel(steps)
	program := tea.NewProgram(m)

	// Run the program and handle any errors.
	if _, err := program.Run(); err != nil {
		return err
	}

	return nil
}
