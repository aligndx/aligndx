'use client';

import { useEffect, useMemo, useState } from "react";
import { SubmissionSelector } from "../submission-selector";
import { Pathogen, PathogenSelector } from "../pathogen-selector";
import { Submission } from "@/types/submission";
import { useApiService } from "@/services/api";
import { useDuckDbQuery } from "duckdb-wasm-kit";
import { DataTable, useColumns } from "../explorer-table";
import { Switch } from "@/components/ui/switch";
import { useBoolean } from "@/hooks/use-boolean";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { ScreeningStatistics, SummaryStatistics } from "../summary-statistics";

export default function ExploreView() {
    const [selectedSubs, setSelectedSubs] = useState<Submission[]>([]);
    const [data, setData] = useState<any>([]);
    const [pathogens, setPathogens] = useState<Pathogen[]>([]);
    const [sourcesData, setSourcesData] = useState<any[]>([]);

    const onSubChange = (subs: Submission[]) => {
        setSelectedSubs(subs);
    };
    const onPathogensChange = (pathogens: Pathogen[]) => {
        setPathogens(pathogens)
    }

    const { data: dataService } = useApiService();
    const filter = `name = "bracken_combined.filtered.transformed_long.tsv"`;
    const { refetch } = dataService.useGetDatasQuery({ filter });

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
            setPathogens([]);
            setSourcesData([]);
            return;
        }

        const fetchSourcesData = async () => {
            const sources = await getURLs(selectedSubs);
            setSourcesData(sources);
        };

        fetchSourcesData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSubs]);

    const sql = useMemo(() => {
        if (!sourcesData || sourcesData.length === 0) {
            return undefined
        };

        // Construct the query to UNION all file sources
        return sourcesData
            .map(
                (source) => `
                    SELECT 
                    *, 
                    '${source.name}' AS submission
                FROM read_csv_auto('${source.url}')
                `
            )
            .join("\nUNION ALL\n");
    }, [sourcesData]);

    const { arrow, loading, error } = useDuckDbQuery(sql);


    const {
        value: showAllPathogens,
        onToggle: toggleShowAllPathogens,
    } = useBoolean(false);

    useEffect(() => {
        if (selectedSubs.length === 0) {
            // If no submissions are selected, clear data immediately.
            setData([]);
            return;
        }

        if (arrow) {
            let arrayData = arrow.toArray();

            // Only proceed with pathogen-related logic if there are selected pathogens and data exists
            if (pathogens.length > 0 && arrayData.length > 0) {
                if (showAllPathogens) {
                    // Map submissions to their samples
                    const submissionSamplesMap: Record<string, Set<any>> = {};

                    arrayData.forEach((row: any) => {
                        const { submission, sample } = row;
                        if (!submissionSamplesMap[submission]) {
                            submissionSamplesMap[submission] = new Set();
                        }
                        submissionSamplesMap[submission].add(sample);
                    });

                    // Build a set for fast existence checking of (submission, sample, taxonomy_id) combinations
                    const existingKeys = new Set(
                        arrayData.map(
                            (row: any) => `${row.submission}|${row.sample}|${row.taxonomy_id}`
                        )
                    );

                    // For each selected pathogen, submission, and sample, append if missing
                    pathogens.forEach((pathogen: Pathogen) => {
                        selectedSubs.forEach((submission) => {
                            const samples = submissionSamplesMap[submission.name];
                            if (samples && samples.size > 0) {
                                samples.forEach((sample: any) => {
                                    const key = `${submission.name}|${sample}|${pathogen.id}`;
                                    if (!existingKeys.has(key)) {
                                        arrayData.push({
                                            submission: submission.name,
                                            sample,
                                            name: pathogen.name,
                                            taxonomy_id: pathogen.id,
                                            taxonomy_lvl: "S",
                                            abundance_num: 0,
                                            abundance_frac: 0,
                                        });
                                        existingKeys.add(key);
                                    }
                                });
                            }
                        });
                    });
                } else {
                    // If not showing all pathogens, filter the data to only include rows 
                    // with taxonomy_ids that match selected pathogens.
                    const selectedPathogenIds = new Set(pathogens.map((p: Pathogen) => p.id));
                    arrayData = arrayData.filter((row: any) => selectedPathogenIds.has(row.taxonomy_id));
                }
            }

            setData(arrayData);
        } else if (error) {
            console.error("DuckDB query error:", error);
        }
    }, [arrow, error, pathogens, selectedSubs, showAllPathogens]);

    const columns = useColumns()
    const isMobile = useMediaQuery("sm", "down");
    return (
        <div>
            <div className={cn("flex p-6", isMobile ? "flex-col justify-center gap-6" : "flex-row justify-between gap-2")}>
                <SubmissionSelector value={selectedSubs} onChange={onSubChange} />
                {data.length > 0 ?
                    <PathogenSelector className={"flex flex-col gap-1"} pathogens={pathogens} onPathogensChange={onPathogensChange} />
                    : null
                }
            </div>
            <div className="flex flex-col gap-2">
                {data.length > 0 && !isMobile ?
                    <div className="flex flex-grow px-2">
                        <SummaryStatistics className="border-none  pb-0" selectedSubs={selectedSubs} />
                    </div>
                    : null
                }

                {pathogens.length > 0 ?
                    <div className="flex flex-row items-center justify-start px-6 pt-4 gap-4">
                        <h1 className="font-bold"> {showAllPathogens ? "Screened Pathogens" : "Detected Pathogens"}</h1>
                        <Switch
                            id="showAllPathogensSwitch"
                            checked={showAllPathogens}
                            onCheckedChange={toggleShowAllPathogens}
                        />
                    </div> :
                    null
                }
                {data.length > 0 ?

                    <DataTable columns={columns} data={data || []} loading={loading} />
                    : null
                }
            </div>
        </div>
    );
}

