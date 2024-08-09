'use client'

import { useApiService } from "@/services/api";
import { useSearchParams } from "@/routes";
import DOMPurify from 'dompurify';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

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
                            value="graph"
                            className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none focus-visible:ring-0 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none "
                        >
                            Graph
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="parameters">
                        Form parameters
                    </TabsContent>
                    <TabsContent value="graph">
                        Example graph
                    </TabsContent>
                </Tabs>
                <div className="flex  flex-col gap-4 p-4 border h-screen bg-muted/50">
                    <header className="text-lg" >
                        {workflow.data?.name}
                    </header>
                    <div className="text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }} />
                    <Separator className="my-4"/>
                </div>
            </div>
        </div>
    )
}
