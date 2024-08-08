import { columns } from "./table/columns"
import { DataTable } from "./table/data-table"
import { Workflow } from "@/types/workflow"

async function getData(): Promise<Workflow[]> {
    // Fetch data from your API here.
    return [
        {
            id: "728ed52f",
            name: "workflow1",
            repository: "github.com/repo",
            description: "blah blah",
            schema: {
                version: "1.0",
                steps: [
                    {
                        name: "Checkout code",
                        action: "actions/checkout@v2"
                    },
                    {
                        name: "Set up Node.js",
                        action: "actions/setup-node@v2",
                        with: {
                            "node-version": "14"
                        }
                    },
                    {
                        name: "Install dependencies",
                        run: "npm install"
                    },
                    {
                        name: "Build",
                        run: "npm run build"
                    },
                    {
                        name: "Deploy",
                        run: "npm run deploy"
                    }
                ]
            }
        },
        {
            id: "489e1d42",
            name: "some workflow2",
            repository: "github.com/repo",
            description: "blah blah blah",
            schema: {
                version: "1.0",
                steps: [
                    {
                        name: "Checkout code",
                        action: "actions/checkout@v2"
                    },
                    {
                        name: "Set up Python",
                        action: "actions/setup-python@v2",
                        with: {
                            "python-version": "3.8"
                        }
                    },
                    {
                        name: "Install dependencies",
                        run: "pip install -r requirements.txt"
                    },
                    {
                        name: "Run tests",
                        run: "pytest"
                    }
                ]
            }
        }
    ]

}

export default async function WorkflowBrowser() {
    const data = await getData()
    return (
        <DataTable columns={columns} data={data} />
    )
}