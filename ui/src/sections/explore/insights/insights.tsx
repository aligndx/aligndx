import { useEffect, useState, useCallback, useMemo } from "react";
import { Submission } from "@/types/submission";
import { SubmissionSelector } from "./submission-selector";
import { SpreadSheet } from "./spread-sheet";
import { useApiService } from "@/services/api";
import { PathogenSelector } from "./pathogen-selector";
import { AsyncDuckDB, useDuckDb } from "duckdb-wasm-kit";
import { handleExport, insertRemoteFile } from "./actions";
import { toast } from "@/components/ui/sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import SummaryStatistics from "./summary-statistics";
import { Switch } from "@/components/ui/switch";

export interface Source {
    id: string;
    url: string;
    name: string;
}

const columnMetadata = {
    name: "Scientific name of the species",
    taxonomy_id: "Unique identifier for the taxonomy",
    taxonomy_lvl: "Level of the taxonomy (e.g., species, genus)",
    sample: "Sample identifier",
    abundance_num: "Numerical abundance of the species",
    abundance_frac: "Fractional abundance of the species",
    submission: "Submission name",
};

interface InsightsProps {
    data: any;
    onDataChange: (newData: any) => void;
    selectedSubs: Submission[];
    onSubChange: (subs: Submission[]) => void;
}

export default function Insights({ data, onDataChange, selectedSubs, onSubChange }: InsightsProps) {
    const { data: dataService } = useApiService();
    const { db, loading } = useDuckDb();
    const isMobile = useMediaQuery("md", "down")

    const filter = `name = "bracken_combined.filtered.transformed_long.tsv"`;
    const { data: queryData, refetch, isLoading } = dataService.useGetDatasQuery({ filter });

    const [metadata] = useState<any>(columnMetadata);
    const rootTableId = "merged_data";
    const [sources, setSources] = useState<Source[]>([]); // Track sources state

    const [pathogens, setPathogens] = useState<string[]>([]);

    const onPathogensChange = (pathogens: string[]) => {
        setPathogens(pathogens)
    }

    const [showAllPathogens, setShowAllPathogens] = useState(false);

    const toggleShowAllPathogens = () => {
        setShowAllPathogens(!showAllPathogens);
    };

    async function getURLs(subs: Submission[]) {
        await refetch();

        // Wait for queryData to be populated and ready
        if (!queryData || queryData.length === 0) {
            console.warn("Query data is empty or not ready yet.");
            return [];
        }

        const urls: Source[] = [];

        // Loop through each submission sequentially
        for (const sub of subs) {
            const dataOfInterest = queryData?.find((item: any) => item.submission === sub.id);
            if (dataOfInterest?.id && dataOfInterest?.name) {
                try {
                    const url = await dataService.getPrivateDataURLQuery(dataOfInterest.id);
                    urls.push({ id: dataOfInterest.id, url, name: sub.name });
                } catch (error) {
                    console.error(`Failed to get URL for submission: ${sub.id}`, error);
                }
            }
        }

        return urls;
    }


    async function loadTable(rootTableId: string, sources: Source[], db: AsyncDuckDB, loading: boolean) {
        if (!db || loading || sources.length === 0) return;

        try {
            const conn = await db.connect();
            await conn.query(`DROP TABLE IF EXISTS ${rootTableId};`);

            for (const source of sources) {
                await insertRemoteFile(db, source.url, source.id);
            }
            const unionQueries = sources.map((source) => `SELECT *, '${source.name}' AS submission FROM ${source.id}`).join(" UNION ALL ");
            await conn.query(`CREATE OR REPLACE TABLE ${rootTableId} AS ${unionQueries};`);

            const result = await conn.query(`SELECT * FROM ${rootTableId};`);
            onDataChange(result.toArray());

            await conn.close();
        } catch (err) {
            console.error("Error loading data into DuckDB:", err);
            toast.error("Couldn't load or join the data");
        }
    }

    async function filterByPathogens(rootTableId: string, pathogens: string[], db: AsyncDuckDB, loading: boolean, showAll: boolean) {
        if (!db || loading) return;
        try {
            const conn = await db.connect();

            const pathogensListStr = pathogens.map(org => `'${org}'`).join(", ");

            let filteredTable;

            if (showAll) {
                // Show all pathogens, including undetected ones with "N/A" values
                filteredTable = await conn.query(`
                    SELECT
                        pathogen_list.name AS name,
                        COALESCE(data.taxonomy_id, 'N/A') AS taxonomy_id,
                        COALESCE(data.taxonomy_lvl, 'N/A') AS taxonomy_lvl,
                        COALESCE(data.sample, 'N/A') AS sample,
                        COALESCE(data.abundance_num, 'N/A') AS abundance_num,
                        COALESCE(data.abundance_frac, 'N/A') AS abundance_frac,
                        COALESCE(data.submission, 'N/A') AS submission
                    FROM 
                        (SELECT unnest(array[${pathogensListStr}]) AS name) AS pathogen_list
                    LEFT JOIN 
                        ${rootTableId} AS data
                    ON pathogen_list.name = data.name
                `);
            } else {
                // Show only detected pathogens
                filteredTable = await conn.query(`
                    SELECT * FROM ${rootTableId} WHERE name IN (${pathogensListStr})
                `);
            }

            onDataChange(filteredTable.toArray());
            await conn.close();
        } catch (err) {
            console.error("Error loading data into DuckDB:", err);
            toast.error("Error filtering pathogens");
        }
    }


    useEffect(() => {
        if (selectedSubs.length === 0) {
            onDataChange([]);
            return;
        }

        const handleDataLoading = async () => {
            const sourcesData = await getURLs(selectedSubs);
            setSources(sourcesData); // Set sources after fetching
        };

        handleDataLoading();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSubs, isLoading]);

    useEffect(() => {
        if (sources.length > 0 && db) {
            loadTable(rootTableId, sources, db, loading);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sources, db, loading]);

    useEffect(() => {
        if (db && pathogens.length > 0) {
            filterByPathogens(rootTableId, pathogens, db, loading, showAllPathogens);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathogens, loading, showAllPathogens])


    const onExport = useCallback(() => {
        if (db) handleExport(db, rootTableId);
    }, [db]);

    return (
        <div className="flex flex-col flex-grow h-full">
            <div className={cn("flex border-b h-full", isMobile ? "flex-col" : "flex-row")}>
                <div className="flex flex-col flex-grow p-10 gap-4">
                    <div className="flex">
                        <SubmissionSelector value={selectedSubs} onChange={onSubChange} />
                    </div>
                    {data.length > 0 && (
                        <div className="flex">
                            <PathogenSelector className="flex flex-col flex-grow gap-4" pathogens={pathogens} onPathogensChange={onPathogensChange} />
                        </div>
                    )}
                </div>
                {data.length > 0 && (
                    <div className={cn("flex flex-col flex-grow p-10 gap-4", isMobile ? "" : "border-l")}>
                        <SummaryStatistics pathogens={pathogens} data={data} selectedSubs={selectedSubs} />
                    </div>
                )}
            </div>
            {selectedSubs.length > 0 && (
                <div className="flex flex-col flex-grow h-full">
                    <div className="flex flex-row items-center justify-start px-10 pt-4 gap-4">
                        <h1 className="font-bold"> {showAllPathogens ? "Screened Pathogens":"Detected Pathogens"}</h1>
                        <Switch
                            id="showAllPathogensSwitch"
                            checked={showAllPathogens}
                            onCheckedChange={toggleShowAllPathogens}
                        />
                    </div>


                    <SpreadSheet data={data} metadata={metadata} onExport={onExport} loading={loading || isLoading} />
                </div>
            )}
        </div>
    );
}
