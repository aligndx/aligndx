"use client";

import React from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
} from "recharts";
import {
    Card as BaseCard,
    CardContent,
    CardDescription,
    CardFooter,
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
const barChartConfig = {
    classified: {
        label: "Classified",
        color: "hsl(var(--chart-1))",
    },
    unclassified: {
        label: "Unclassified",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig;

interface BarChartSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
    data: SampleData[];
}

export default function BarChartSummary({
    data,
    className,
    ...props
}: BarChartSummaryProps) {
    const chartData = data.map((sample) => ({
        name: sample.sample_name,
        classified: sample.classified_reads,
        unclassified: sample.unclassified_reads,
    }));

    return (
        <BaseCard className={`flex flex-col ${className}`} {...props}>
            <CardHeader>
                <CardTitle className="text-md">Read Classification</CardTitle>
                <CardDescription>Number of reads classified per sample</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={barChartConfig}>
                    <BarChart data={chartData} barCategoryGap={16}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            tick={false}
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                        />
                        <Bar
                            dataKey="classified"
                            stackId="a"
                            fill="var(--color-classified)"
                            radius={2}
                        />
                        <Bar
                            dataKey="unclassified"
                            stackId="a"
                            fill="var(--color-unclassified)"
                            radius={2}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </BaseCard>
    );
}
