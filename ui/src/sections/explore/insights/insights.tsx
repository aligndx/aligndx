import { useEffect, useState, useCallback, useMemo } from "react";
import { Submission } from "@/types/submission";
import { SubmissionSelector } from "./submission-selector";
import { SpreadSheet } from "./spread-sheet";
import { useApiService } from "@/services/api";
import { PathogenSelector } from "./pathogen-selector";
import { AsyncDuckDB, useDuckDb } from "duckdb-wasm-kit";
import { handleExport, insertRemoteFile } from "./actions";
import { toast } from "@/components/ui/sonner";

export interface Source {
    id: string; // Table name
    url: string; // URL for the source file
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

    const filter = `name = "bracken_combined.filtered.transformed_long.tsv"`;
    const { data: queryData, refetch, isLoading } = dataService.useGetDatasQuery({ filter });

    const [metadata] = useState<any>(columnMetadata);
    const rootTableId = "merged_data";
    const [sources, setSources] = useState<Source[]>([]); // Track sources state

    const [pathogens, setPathogens] = useState<string[]>([]);

    const onPathogensChange = (pathogens: string[]) => {
        setPathogens(pathogens)
    }

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
            if (dataOfInterest?.id) {
                try {
                    const url = await dataService.getPrivateDataURLQuery(dataOfInterest.id);
                    urls.push({ id: dataOfInterest.id, url });
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

            const unionQueries = sources.map((source) => `SELECT * FROM ${source.id}`).join(" UNION ALL ");
            await conn.query(`CREATE OR REPLACE TABLE ${rootTableId} AS ${unionQueries};`);

            const result = await conn.query(`SELECT * FROM ${rootTableId};`);
            onDataChange(result.toArray());

            await conn.close();
        } catch (err) {
            console.error("Error loading data into DuckDB:", err);
            toast.error("Couldn't load or join the data");
        }
    }

    async function filterByPathogens(rootTableId: string, pathogens: string[], db: AsyncDuckDB, loading: boolean) {
        if (!db || loading) return;
        try {
            const conn = await db.connect();
            const pathogensListStr = pathogens.map(org => `'${org}'`).join(", ");
            const filteredTable = await conn.query(`SELECT * FROM ${rootTableId} WHERE name IN (${pathogensListStr})`);
            onDataChange(filteredTable.toArray());
            await conn.close();
        } catch (err) {
            console.error("Error loading data into DuckDB:", err);
            toast.error("Error filtering");
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
            filterByPathogens(rootTableId, pathogens, db, loading);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathogens, loading])


    const onExport = useCallback(() => {
        if (db) handleExport(db, rootTableId);
    }, [db]);

    const pathogenStatistic = () => {
        const pathogensToScreen = pathogens.length
        const organisms = data.length
        if (pathogensToScreen > organisms) {
            return (
                <p>Pathogens Detected | {organisms} of {pathogensToScreen} screened</p>
            )
        }

        return null
    }

    return (
        <div className="flex flex-col flex-grow h-full">
            <div className="flex flex-row border-b h-full">
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
                    <div className="border-l flex flex-col flex-grow p-10 gap-4">
                        <h1 className="font-bold">Summary Statistics </h1>
                        {pathogenStatistic()}
                    </div>
                )}
            </div>
            {selectedSubs.length > 0 && (
                <div className="flex flex-col flex-grow h-full">
                    <h1 className="font-bold px-10 pt-10">Detected Pathogens </h1>
                    <SpreadSheet data={data} metadata={metadata} onExport={onExport} loading={loading || isLoading} />
                </div>
            )}
        </div>
    );
}
