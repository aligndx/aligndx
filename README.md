# AlignDx

AlignDx is a comprehensive platform for pathogen detection and analysis. It streamlines workflows, empowers data exploration, and delivers real-time insights to help you make faster, informed decisions.


## Key Features

- **Automated Workflows:** Simplifies pathogen detection, reducing manual effort.
- **Data Exploration:** Provides tools to analyze and compare your data effectively.
- **Real-Time Updates:** Delivers results as they happen.
- **Visualizations:** Includes built-in analytics to help you interpret your data.


## Installation

Download the latest version of AlignDx from the [Releases](https://github.com/aligndx/aligndx/releases) page.

### Prerequisites

- **Docker:** [Install Docker](https://docs.docker.com/get-docker/)
- **Java 17+:** [Install Java](https://adoptium.net/)

### Using Precompiled Binaries

1. Visit the [Releases](https://github.com/aligndx/aligndx/releases) page.
2. Download the binary for your operating system (`aligndx_<version>_<os>_<arch>.tar.gz`).
3. Extract the binary:
   ```bash
   tar -xzf aligndx_<version>_<os>_<arch>.tar.gz
   ```
4. Move the binary to a directory in your `PATH` (e.g., `/usr/local/bin`):
   ```bash
   mv aligndx /usr/local/bin/
   ```
5. Verify the installation:
   ```bash
   aligndx --version
   ```


## Usage

AlignDx includes two main commands:

### **`init`**
Sets up the necessary environment and dependencies.

Run:
```bash
aligndx init
```

During this process, AlignDx will:
- Create required workflow folders.
- Check for Java and Docker installations.
- Automatically download and install Nextflow.

### **`start`**
Starts the AlignDx web application, accessible at `http://localhost:3000`.

Run:
```bash
aligndx start
```

## Build from Source

If you prefer to build AlignDx from source:

1. Ensure [Go](https://golang.org/) is installed (version 1.19+ recommended).
2. Clone this repository:
   ```bash
   git clone https://github.com/aligndx/aligndx.git
   ```
3. Navigate to the project directory:
   ```bash
   cd aligndx
   ```
4. Build the binary:
   ```bash
   go build -o aligndx
   ```
5. Move the binary to a directory in your `PATH` (e.g., `/usr/local/bin`):
   ```bash
   mv aligndx /usr/local/bin/
   ```

## Contributing

We welcome contributions! To get started:

1. Fork this repository.
2. Create a new branch (`git checkout -b feature/my-feature`).
3. Make your changes and commit them (`git commit -m "Add my feature"`).
4. Push your branch (`git push origin feature/my-feature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


## Contact

For questions or suggestions, please open an [issue](https://github.com/aligndx/aligndx/issues).
