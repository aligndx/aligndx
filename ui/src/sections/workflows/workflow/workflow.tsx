'use client'

import { useApiService } from "@/services/api";
import { useSearchParams } from "@/routes";
import WorkflowForm, { WorkflowFormSkeleton } from "./workflow-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function Workflow() {
    const searchParams = useSearchParams();
    const workflowId = searchParams.get('id');
    const { workflows: workflowsService } = useApiService();

    const { data, isLoading } = workflowsService.useGetWorkflow(workflowId || "");

    return (
        <div className="flex flex-col gap-2 h-full flex-grow">
            <header className="px-6 py-2 sticky text-2xl" >
                {data?.name || <Skeleton className="w-32 h-6" />}
            </header>
            {
                isLoading ?
                    <WorkflowFormSkeleton />
                    :
                    data && <WorkflowForm workflow={data} />
            }
        </div>
    )
}
