'use client';

import { useEffect, useState } from 'react';
import { MenuOpenIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import Chart from './chart';
import SpreadSheet, { Source } from './spread-sheet';
import { Submission } from '@/types/submission';
import { SubmissionSelector } from './submission-selector';
import { Data } from '@/types/data';
import { useApiService } from '@/services/api';
import { Separator } from "@/components/ui/separator"

export default function InsightsView() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedSubmissions, setSelectedSubmissions] = useState<Submission[]>([]);
    const [data, setData] = useState<any>([]); // Todo: Set a type for this data
    const [dataSources, setDataSources] = useState<Source[]>([]);
    const { data: dataService } = useApiService()

    const isData = (output: string | Data): output is Data => {
        return (output as Data).name !== undefined;
    }

    const getURLs = async (subs: Submission[]) => {
        const urlPromises = subs.flatMap((sub) => {
            return sub.outputs
                .filter(isData)
                .filter((data: Data) => data.name === 'bracken_combined.filtered.tsv') // Get bracken output file
                .map(async (data: Data) => {
                    const url = await dataService.getPrivateDataURLQuery(data.id || ''); // Safely access 'id'
                    return { id: sub.id, url }; // Return object with id and url
                });
        });

        const urls = await Promise.all(urlPromises);
        return urls;
    };

    const handleSubmissionSelectionChange = async (subs: Submission[]) => {
        setSelectedSubmissions(subs)

        const urls = await getURLs(subs)
        setDataSources(urls)
    }

    return (
        <div className="flex h-full transition-all duration-300 overflow-hidden">
            {/* Left section */}
            <div
                className={`flex flex-col flex-grow transition-all duration-300 ${isSidebarOpen ? 'w-full' : 'w-full'
                    }`}
            >
                <Chart data={data} />

                <SpreadSheet
                    sources={dataSources}
                    data={data}
                    onDataChange={(value) => setData(value)}
                />
            </div>

            <button
                className={cn("absolute z-10 rounded-full p-2 transition-transform duration-300", "right-0")}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? (
                    <MenuOpenIcon className="w-6 h-6 transform rotate-180" />
                ) : (
                    <MenuOpenIcon className="w-6 h-6" />
                )}
            </button>

            <div
                className={`transition-all duration-300 ${isSidebarOpen ? 'border w-[400px]' : 'w-0'
                    } overflow-hidden`}
            >
                {isSidebarOpen && (
                    <div className="flex flex-col gap-4 p-4 pt-10 ">
                        <h1 className="text-xl font-bold">Data</h1>
                        <SubmissionSelector
                            value={selectedSubmissions}
                            onChange={handleSubmissionSelectionChange}
                            multiple />
                        <Separator />
                        <h1 className="text-xl font-bold">Chart</h1>
                    </div>
                )}
            </div>
        </div>
    );
}
