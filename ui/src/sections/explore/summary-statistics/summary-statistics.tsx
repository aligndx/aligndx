"use client";

import React, { useEffect, useMemo, useState } from "react";
import RadialChartSummary from "./radial-summary";
import BarChartSummary from "./bar-summary";
import { useDuckDbQuery } from "duckdb-wasm-kit";
import { createDropdownMenuScope } from "@radix-ui/react-dropdown-menu";
import { useApiService } from "@/services/api";
import { Submission } from "@/types/submission";
import { Skeleton } from "@/components/ui/skeleton";

export interface SampleData {
    sample_name: string;
    total_sequences: number;
    classified_reads: number;
    unclassified_reads: number;
    percentage_classified: number;
}

interface SummaryStatisticsProps extends React.HTMLAttributes<HTMLDivElement> {
    selectedSubs: any[]
}

// Main Component to switch between Radial and Bar Chart
export default function SummaryStatistics({
    selectedSubs,
    ...props
}: SummaryStatisticsProps) {
    const [data, setData] = useState<any>([]);
    const { data: dataService } = useApiService();
    const filter = `name = "summary_statistics.csv"`;
    const { refetch } = dataService.useGetDatasQuery({ filter });
    const [sources, setSources] = useState<any[]>([]); // Track sources state

    async function getURLs(subs: Submission[]) {
        // Refetch data and ensure it's updated
        const refetchResult = await refetch();

        // Validate refetch result
        if (!refetchResult || !refetchResult.data || refetchResult.data.length === 0) {
            console.warn("Refetch failed or returned no data.");
            return [];
        }

        // Use the latest queryData
        const freshQueryData = refetchResult.data;

        const urls = [];

        // Loop through each submission sequentially
        for (const sub of subs) {
            const dataOfInterest = freshQueryData?.find((item: any) => item.submission === sub.id);

            if (dataOfInterest?.id && dataOfInterest?.name) {
                try {
                    const url = await dataService.getPrivateDataURLQuery(dataOfInterest.id);
                    urls.push({ id: dataOfInterest.id, url, name: sub.name });
                } catch (error) {
                    console.error(`Failed to get URL for submission: ${sub.id}`, error);
                }
            } else {
                console.warn(`No matching data found for submission: ${sub.id}`);
            }
        }

        return urls;
    }

    // Fetch URLs when selectedSubs changes
    useEffect(() => {
        if (selectedSubs.length === 0) {
            setSources([])
            return;
        }

        const fetchSourcesData = async () => {
            const sources = await getURLs(selectedSubs);
            setSources(sources);
        };

        fetchSourcesData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSubs]);


    const sql = useMemo(() => {
        if (!sources || sources.length === 0) {
            return undefined
        };

        // Construct the query to UNION all file sources
        return sources
            .map(
                (source) => `
                    SELECT 
                    *, 
                    '${source.name}' AS submission
                FROM read_csv_auto('${source.url}')
                `
            )
            .join("\nUNION ALL\n");
    }, [sources]);

    const { arrow, loading, error } = useDuckDbQuery(sql);

    useEffect(() => {
        if (sources.length === 0) {
            // If no submissions are selected, clear data immediately.
            setData([]);
            return;
        }

        if (arrow) {
            let arrayData = arrow.toArray();

            // Convert BigInt fields to Numbers
            const convertedData = arrayData.map((row) => {
                return Object.fromEntries(
                    Object.entries(row).map(([key, value]) => {
                        // Convert BigInt to Number, leave other types as-is
                        if (typeof value === "bigint") {
                            return [key, Number(value)];
                        }
                        return [key, value];
                    })
                );
            });

            setData(convertedData);
        } else if (error) {
            console.error("DuckDB query error:", error);
        }
    }, [arrow, error, sources]);

    if (loading) {
        return (
            <div className="flex gap-2 px-6 ">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        )
    }

    if (data.length === 1) {
        return (
            <RadialChartSummary
                data={data}
                {...props}
            />
        );
    } else {
        return (
            <BarChartSummary
                data={data}
                {...props}
            />
        );
    }
}
