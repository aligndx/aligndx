import { Submission } from "@/types/submission";
import { SubmissionSelector } from "./submission-selector";
import { useEffect } from "react";

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
    useEffect(()=> {
        if (selectedSubs.length > 0) {
            onDataChange(selectedSubs)
        } else {
            onDataChange(null)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[selectedSubs])

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
                <div className="flex flex-grow h-full">
                    test
                </div>
            }
        </div>
    )
}