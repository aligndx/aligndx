'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRef, useState } from "react";
import jsonData from './data.json'
import { ChartForm, ChartContainer } from "../chart";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export default function ExploreView() {
    const [data, setData] = useState<any>(jsonData); // Todo: Set a type for this data
    const chartRef = useRef<HTMLDivElement | null>(null);
    const isLarge = useMediaQuery("lg", "up");

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
            <TabsContent value="visualize" className={cn("flex h-full overflow-hidden", isLarge ? "flex-row" : "flex-col")}>
                <ChartContainer
                    ref={chartRef}
                    className="flex flex-grow h-full w-full items-center justify-center"
                />
                <ChartForm
                    className={cn("flex flex-col gap-4 p-10", isLarge ? "border-l w-[300px]":  "border-t" )}
                    chartRef={chartRef}
                    data={data}
                />

            </TabsContent>

        </Tabs>
    );
}

