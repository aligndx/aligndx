'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRef, useState } from "react";
import { ChartForm, ChartContainer } from "../chart";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Submission } from "@/types/submission";
import { Insights } from "../insights";

export default function ExploreView() {
    const [data, setData] = useState<any>([]); 
    const [selectedSubs, setSelectedSubs] = useState<Submission[]>([]);

    const chartRef = useRef<HTMLDivElement | null>(null);
    const isLarge = useMediaQuery("lg", "up");

    const onDataChange = (newData: any) => {
        setData(newData)
    }
    const onSubChange = (subs: Submission[]) => {
        setSelectedSubs(subs);
    };

    return (
        <Tabs defaultValue="insights" className="flex flex-col h-full transition-all duration-300 overflow-hidden">
            <TabsList className="flex items-center justify-start" variant="underlined">
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger disabled={data === null || data.length === 0} value="visualize">Visualize</TabsTrigger>
            </TabsList>
            <TabsContent value="insights" className="flex flex-col h-full">
                <Insights
                    data={data}
                    onDataChange={onDataChange}
                    selectedSubs={selectedSubs}
                    onSubChange={onSubChange}
                />
            </TabsContent>
            <TabsContent value="visualize" className={cn("flex h-full overflow-hidden", isLarge ? "flex-row" : "flex-col")}>

                <div className="flex flex-grow h-full w-full">
                    <ChartContainer
                        ref={chartRef}
                        className="flex flex-grow h-full w-full items-center justify-center"
                    />
                    <ChartForm
                        className={cn("flex flex-col gap-4 p-10", isLarge ? "border-l w-[300px]" : "border-t")}
                        chartRef={chartRef}
                        data={data}
                    />
                </div>

            </TabsContent>

        </Tabs>
    );
}

