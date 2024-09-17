'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function InsightsView() {

    return (
        <Tabs defaultValue="transform" className="flex flex-col h-full transition-all duration-300 overflow-hidden">
            <TabsList className="flex items-center justify-start" variant="underlined">
                <TabsTrigger value="transform">Transform</TabsTrigger>
                <TabsTrigger value="visualize">Visualize</TabsTrigger>
            </TabsList>
            <TabsContent value="transform">Make changes to your transform here.</TabsContent>
            <TabsContent value="visualize">Change your visualize here.</TabsContent>

        </Tabs>
    );
}

