'use client'

import { useApiService } from "@/services/api";
import { useSearchParams } from "@/routes";
import DOMPurify from 'dompurify';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import WorkflowForm, { WorkflowFormSkeleton } from "./workflow-form";
import { GitBranch } from "@/components/icons";
import Loader from "@/components/ui/loader";
import { Skeleton } from "@/components/ui/skeleton";

export default function Workflow() {
    const searchParams = useSearchParams();
    const workflowId = searchParams.get('id');
    const { workflows: workflowsService } = useApiService();

    const workflow = workflowsService.useGetWorkflow(workflowId || "");

    const description = workflow.data?.description || "";

    return (
        <div>
            <header className="px-6 py-2 sticky text-2xl" >
                {workflow.data?.name || <Skeleton className="w-32 h-6" />}
            </header>
            <div className="flex">
                <Tabs defaultValue="parameters" className="relative mr-auto w-full">
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
                    <TabsContent value="parameters">

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
        </div>
    )
}
