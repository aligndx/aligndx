'use client'

import { useApiService } from "@/services/api";
import { columns } from "./columns"
import { DataTable } from "./data-table"

export default function WorkflowExplorer() {
    const { workflows: workflowsService } = useApiService();
    const { data: workflows, isLoading } = workflowsService.getWorkflowsQuery;

    return (
        <DataTable columns={columns} data={workflows || []} loading={isLoading}/>
    )
}