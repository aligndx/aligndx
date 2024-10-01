'use client'

import { useApiService } from "@/services/api";
import WorkflowForm, { WorkflowFormSkeleton } from "../workflow/workflow-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area";

export default function WorkflowView() {
    const { workflows: workflowsService } = useApiService();

    const workflows = workflowsService.getWorkflowsQuery
    const { data, isLoading } = workflows

    return (
        <div className="flex flex-col gap-2 h-full flex-grow">
            <h1 className="pb-5 p-4">Pathogen Detection Workflow </h1>
            <Tabs defaultValue="workflow" className="flex flex-col h-full transition-all duration-300 overflow-hidden">
                <TabsList className="flex items-center justify-start" variant="underlined">
                    <TabsTrigger value="workflow">Workflow</TabsTrigger>
                    <TabsTrigger disabled={data === null} value="faq">FAQ</TabsTrigger>
                </TabsList>
                <TabsContent value="workflow" className="flex flex-col h-full p-4">
                    {
                        isLoading ?
                            <WorkflowFormSkeleton />
                            :
                            data && <WorkflowForm workflow={data[0]} />
                    }
                </TabsContent>
                <TabsContent value="faq" className="flex flex-col h-full p-4 overflow-scroll">
                    {data && data[0].description ? (
                        <div
                            style={{ whiteSpace: "pre-wrap" }} // Preserve whitespace and line breaks
                            dangerouslySetInnerHTML={{ __html: data[0].description }}
                        />
                    ) : null}
                </TabsContent>


            </Tabs>
        </div>
    )
}
