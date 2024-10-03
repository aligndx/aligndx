'use client'

import { useApiService } from "@/services/api";
import { useColumns } from "./columns"
import { DataTable } from "./data-table"

export default function SubmissionExplorer() {
    const { submissions} = useApiService();
    const { data, isLoading } = submissions.getSubmissionsQuery;
    const columns = useColumns()
    return (
        <DataTable columns={columns} data={data || []} loading={isLoading}/>
    )
}