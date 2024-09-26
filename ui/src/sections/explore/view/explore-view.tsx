'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRef, useState } from "react";
import jsonData from './data.json'
import { ChartForm, ChartContainer } from "../chart";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function ExploreView() {
    const [data, setData] = useState<any>(jsonData); // Todo: Set a type for this data
    const chartRef = useRef<HTMLDivElement | null>(null);
    const isMobile = useMediaQuery("(max-width: 768px)");

    return (
        <Tabs defaultValue="insights" className="flex flex-col h-full transition-all duration-300 overflow-hidden">
            <TabsList className="flex items-center justify-start" variant="underlined">
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="visualize">Visualize</TabsTrigger>
            </TabsList>
            <TabsContent value="insights" className="flex flex-col h-full">
                <div className="flex flex-grow h-full ">
                    Some data
                </div>
            </TabsContent>
            <TabsContent value="visualize" className="flex flex-col h-full overflow-hidden">
                <ChartContainer
                    ref={chartRef}
                    className="flex flex-grow h-full w-full items-center justify-center"
                />
                <ChartForm
                    chartRef={chartRef}
                    data={data}
                />

            </TabsContent>

        </Tabs>
    );
}

