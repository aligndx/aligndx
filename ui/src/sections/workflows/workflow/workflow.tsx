'use client'

import { useApiService } from "@/services/api";
import { useSearchParams } from "@/routes";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import WorkflowForm, { WorkflowFormSkeleton } from "./workflow-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function Workflow() {
    const searchParams = useSearchParams();
    const workflowId = searchParams.get('id');
    const { workflows: workflowsService } = useApiService();

    const workflow = workflowsService.useGetWorkflow(workflowId || "");

    return (
        <div className="flex flex-col gap-2 h-full flex-grow">
            <header className="px-6 py-2 sticky text-2xl" >
                {workflow.data?.name || <Skeleton className="w-32 h-6" />}
            </header>
            <Tabs defaultValue="parameters" className="w-full flex flex-col flex-grow">
                <TabsList
                    variant="underlined"
                    className="w-full justify-start"
                >
                    <TabsTrigger
                        value="parameters"
                    >
                        Parameters
                    </TabsTrigger>
                    <TabsTrigger
                        value="runs"
                    >
                        Runs
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="parameters" className="flex flex-grow">
                    {
                        workflow.isLoading ?
                            <WorkflowFormSkeleton />
                            :
                            <WorkflowForm id={workflow.data?.id || ""} name={workflow.data?.name || ""} repository={workflow.data?.repository || ""} description={workflow.data?.description || ""} jsonSchema={workflow.data?.schema} />
                    }
                </TabsContent>
                <TabsContent value="runs" className="p-4">
                    Example runs
                </TabsContent>
            </Tabs>
        </div>
    )
}
