'use client'

import { useApiService } from "@/services/api";
import WorkflowForm, { WorkflowFormSkeleton } from "../workflow/workflow-form";

export default function WorkflowView() {
    const { workflows: workflowsService } = useApiService();

    const workflows = workflowsService.getWorkflowsQuery
    const { data, isLoading } = workflows
 
    return (
        <div className="flex flex-col gap-2 h-full flex-grow"> 
            {
                isLoading ?
                    <WorkflowFormSkeleton />
                    :
                    data && <WorkflowForm workflow={data[0]}/>
            }
        </div>
    )
}
