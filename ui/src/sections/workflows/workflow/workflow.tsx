'use client'

import { useApiService } from "@/services/api";
import { useSearchParams } from "@/routes";
import DOMPurify from 'dompurify';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import WorkflowForm from "./workflow-form";
import { GitBranch } from "@/components/icons";

export default function Workflow() {
    const searchParams = useSearchParams();
    const workflowId = searchParams.get('id');
    const { workflows: workflowsService } = useApiService();

    const workflow = workflowsService.useGetWorkflow(workflowId || "");

    const description = workflow.data?.description || "";

    return (
        <div>
            <header className="px-6 py-2 sticky text-2xl" >
                {workflow.data?.name}
            </header>
            <div className="flex">
                <Tabs defaultValue="parameters" className="relative mr-auto w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                        <TabsTrigger
                            value="parameters"
                            className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none focus-visible:ring-0 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none "
                        >
                            Parameters
                        </TabsTrigger>
                        <TabsTrigger
                            value="runs"
                            className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none focus-visible:ring-0 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none "
                        >
                            Runs
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="parameters" className="p-4">
                        {
                            workflow.isLoading ? "loading" :
                                <WorkflowForm jsonSchema={workflow.data?.schema} />
                        }

                    </TabsContent>
                    <TabsContent value="runs" className="p-4">
                        Example runs
                    </TabsContent>
                </Tabs>
                <div className="flex  flex-col gap-4 p-4 border h-screen bg-muted/50">
                    <header className="flex  gap-2 text-lg" >
                        {workflow.data?.name}
                        <a className="flex flex-row  gap-2 underline items-center text-sm hover:text-muted-foreground"
                            href={workflow.data?.repository}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => { e.stopPropagation(); }}
                        >
                            <GitBranch />
                        </a>
                    </header>
                    <div className="text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }} />
                    <Separator className="my-4" />
                </div>
            </div>
        </div>
    )
}
