import { useApiService } from "@/services/api";
import { Submission } from "@/types/submission";
import { useCallback, useEffect, useState } from "react";
import { Source } from "./insights";
import { handleExport, insertRemoteFile } from "./actions";
import { toast } from "sonner";
import { AsyncDuckDB, useDuckDb } from "duckdb-wasm-kit";
import { SpreadSheet } from "./spread-sheet";

interface SummaryStatisticsProps {
    data: any
    pathogens: string[];
    selectedSubs: Submission[];
}


const columnMetadata = {
    sample_name: "Sample identifier extracted from the filename.",
    total_sequences: "Sum of classified and unclassified reads.",
    classified_reads: "Count of reads that match a taxon.",
    unclassified_reads: "Count of reads that do not match any taxon.",
    percentage_classified:"Proportion of reads that were classified.",
    submission: "Submission name.",
};

export default function SummaryStatistics({ data, pathogens, selectedSubs }: SummaryStatisticsProps) {
    const { data: dataService } = useApiService();
    const filter = `name = "summary_statistics.csv"`;
    const rootTableId = "summary_data"
    const { data: queryData, refetch, isLoading } = dataService.useGetDatasQuery({ filter });
    const [sources, setSources] = useState<Source[]>([]); // Track sources state
    const [summaryData, setSummaryData] = useState<any>()
    const [metadata] = useState<any>(columnMetadata);

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
            setSummaryData(result.toArray());
            await conn.close();
        } catch (err) {
            console.error("Error loading data into DuckDB:", err);
            toast.error("Couldn't load or join the data");
        }
    }

    useEffect(() => {
        if (selectedSubs.length === 0) {
            setSummaryData([]);
            return;
        }

        const handleDataLoading = async () => {
            const sourcesData = await getURLs(selectedSubs);
            setSources(sourcesData); // Set sources after fetching
        };

        handleDataLoading();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSubs, isLoading]);

    const { db, loading } = useDuckDb();

    useEffect(() => {
        if (sources.length > 0 && db) {
            loadTable(rootTableId, sources, db, loading);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sources, db, loading]);


    const onExport = useCallback(() => {
        if (db) handleExport(db, rootTableId);
    }, [db]);

    const pathogenStatistic = () => {
        const pathogensToScreen = pathogens.length
        const organisms = data.length && selectedSubs.length && data.length / selectedSubs.length
        if (pathogensToScreen > organisms) {
            return (
                <p>Pathogens Detected | {organisms} of {pathogensToScreen} screened</p>
            )
        }

        return null
    }

    return (
        <>
            <h1 className="font-bold">Summary Statistics </h1>
            {pathogenStatistic()}
            <SpreadSheet data={summaryData}  metadata={metadata} onExport={onExport} loading={loading || isLoading}  />
        </>
    )
}
