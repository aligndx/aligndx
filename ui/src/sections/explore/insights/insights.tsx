import { Submission } from "@/types/submission";
import { SubmissionSelector } from "./submission-selector";
import { useEffect, useState } from "react";
import { SpreadSheet } from "./spread-sheet";
import { useApiService } from "@/services/api";
import { Source } from "./spread-sheet/spread-sheet";

interface InsightsProps {
    data: any;
    onDataChange: (newdata: any) => void;
    selectedSubs: Submission[];
    onSubChange: (subs: Submission[]) => void;
}

export default function Insights({
    data,
    onDataChange,
    selectedSubs,
    onSubChange,
}: InsightsProps) {

    const { data: dataService } = useApiService();
    const [sources, setSources] = useState<any>()

    const filter = `name = "bracken_combined.filtered.transformed_long.tsv"`;
    const { data: queryData, refetch } = dataService.useGetDatasQuery({ filter })

    const getURLs = async (subs: Submission[]) => {
        refetch();
        const urlPromises = subs.flatMap(async (sub) => {
            const dataOfInterest = queryData?.filter((item) => item.submission === sub.id);
            const dataFile = dataOfInterest && dataOfInterest[0]?.id;
            if (dataFile) {
                const url = await dataService.getPrivateDataURLQuery(dataFile); // Safely access 'id'
                return { id: `${dataFile}`, url }; // Return object with id and url
            }
            return undefined; // Explicitly return undefined for no results
        });

        const urls = await Promise.all(urlPromises);
        return urls.filter((url) => url !== undefined); // Filter out undefined values
    };

    useEffect(() => {
        const handleSubChange = async () => {
            if (selectedSubs.length > 0) {
                const urls = await getURLs(selectedSubs);
                setSources(urls as Source[])
            }
        }
        handleSubChange()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSubs])

    return (
        <div className="flex flex-col flex-grow h-full">
            <div className="flex flex-row border-b h-full">
                <div className="flex flex-col flex-grow p-10 gap-4">
                    <h1 className="font-bold">Data </h1>
                    <div className="flex">
                        <SubmissionSelector
                            value={selectedSubs}
                            onChange={onSubChange} />
                    </div>
                </div>
                {selectedSubs.length > 0 &&
                    <div className="border-l flex flex-col flex-grow p-10 gap-4">
                        <h1 className="font-bold">Summary Statistics </h1>
                        <p>Pathogens Detected | 1 of 260 screened</p>
                    </div>}
            </div>
            {selectedSubs.length > 0 &&
                <div className="flex flex-col flex-grow h-full">
                    <h1 className="font-bold px-10 pt-10">Detected Pathogens </h1>
                    <SpreadSheet sources={sources} data={data} onDataChange={onDataChange} />
                </div>
            }
        </div>
    )
}