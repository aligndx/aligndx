'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function InsightsView() {

    return (
        <Tabs defaultValue="insights" className="flex flex-col h-full transition-all duration-300 overflow-hidden">
            <TabsList className="flex items-center justify-start" variant="underlined">
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="visualize">Visualize</TabsTrigger>
            </TabsList>
            <TabsContent value="insights">Make changes to your insights here.</TabsContent>
            <TabsContent value="visualize">Change your visualize here.</TabsContent>

        </Tabs>
    );
}

