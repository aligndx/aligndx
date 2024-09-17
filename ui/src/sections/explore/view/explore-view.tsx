'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ChartForm from "../chart";
import { useRef, useState } from "react";

export default function ExploreView() {
    const [data, setData] = useState<any>([]); // Todo: Set a type for this data
    const chartRef = useRef<HTMLDivElement | null>(null);
    return (
        <Tabs defaultValue="insights" className="pt-5 flex flex-col h-full transition-all duration-300 overflow-hidden">
            <TabsList className="flex items-center justify-start" variant="underlined">
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="visualize">Visualize</TabsTrigger>
            </TabsList>
            <TabsContent value="insights">Make changes to your insights here.</TabsContent>
            <TabsContent value="visualize">
                <ChartForm data={data} chartRef={chartRef}/>
            </TabsContent>

        </Tabs>
    );
}

