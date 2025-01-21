"use client";

import React from "react";
import {
    RadialBar,
    RadialBarChart,
    PolarRadiusAxis,
    Label,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { SampleData } from "./summary-statistics";

// Chart Configuration
const radialChartConfig = {
    classified: {
        label: "Classified",
        color: "hsl(var(--chart-1))",
    },
    unclassified: {
        label: "Unclassified",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig;

interface RadialChartSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
    data: SampleData[];
}

// Function to render Radial Chart
export default function RadialChartSummary({
    data,
    className,
    ...props
}: RadialChartSummaryProps) {
    const totalReads = data[0].classified_reads + data[0].unclassified_reads;

    return (
        <Card className={`flex flex-col ${className}`} {...props}>
            <CardHeader>
                <CardTitle className="text-md">Read Classification</CardTitle>
                <CardDescription>Number of reads classified per sample</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 items-center pb-0">
                <ChartContainer
                    config={radialChartConfig}
                    className="mx-auto aspect-square w-full max-w-[250px]"
                >
                    <RadialBarChart
                        data={data}
                        innerRadius={80}
                        outerRadius={130}
                        endAngle={180}
                    >
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) - 16}
                                                    className="fill-foreground text-2xl font-bold"
                                                >
                                                    {totalReads}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 4}
                                                    className="fill-muted-foreground"
                                                >
                                                    Total Reads
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </PolarRadiusAxis>
                        {/* Add RadialBar for each data key */}
                        <RadialBar
                            key="classified-bar" // Add unique key
                            dataKey="classified_reads"
                            stackId="a"
                            cornerRadius={5}
                            fill="var(--color-classified)"
                            className="stroke-transparent stroke-2"
                        />
                        <RadialBar
                            key="unclassified-bar" // Add unique key
                            dataKey="unclassified_reads"
                            stackId="a"
                            cornerRadius={5}
                            fill="var(--color-unclassified)"
                            className="stroke-transparent stroke-2"
                        />

                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
