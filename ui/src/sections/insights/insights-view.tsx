'use client';

import { useEffect, useRef, useState } from 'react';
import { DownloadIcon, MenuOpenIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import SpreadSheet, { Source } from './spread-sheet';
import { Submission } from '@/types/submission';
import { SubmissionSelector } from './submission-selector';
import { Data } from '@/types/data';
import { useApiService } from '@/services/api';
import ChartForm from './chart';
import { Button } from '@/components/ui/button';

export default function InsightsView() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedSubmissions, setSelectedSubmissions] = useState<Submission[]>([]);
    const [data, setData] = useState<any>([]); // Todo: Set a type for this data
    const [dataSources, setDataSources] = useState<Source[]>([]);
    const { data: dataService } = useApiService();
    const chartRef = useRef<HTMLDivElement | null>(null);
    const [isSvgAvailable, setIsSvgAvailable] = useState(false);

    const handlePlotExport = () => {
        if (chartRef.current) {
            const svgElement = chartRef.current.querySelector('svg');

            if (svgElement) {
                // Clone the SVG node to avoid mutating the live DOM element
                const clonedSvgElement = svgElement.cloneNode(true);

                // Serialize the cloned SVG element into an XML string
                const serializer = new XMLSerializer();
                let svgString = serializer.serializeToString(clonedSvgElement);

                // Create a blob and trigger the download
                const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
                const downloadLink = document.createElement("a");
                downloadLink.href = URL.createObjectURL(svgBlob);
                downloadLink.download = "chart.svg";
                downloadLink.click();
            }
        }
    };

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
    
    const handleSubmissionSelectionChange = async (subs: Submission[]) => {
        setSelectedSubmissions(subs);
    
        const urls = await getURLs(subs);
        setDataSources(urls as Source[]); // Cast to Source[] since undefined values are removed
    };
    
    // Monitor chartRef for changes using MutationObserver
    useEffect(() => {
        const observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    const svgElement = chartRef.current?.querySelector('svg');
                    setIsSvgAvailable(!!svgElement); // Update state based on SVG presence
                }
            }
        });

        if (chartRef.current) {
            observer.observe(chartRef.current, { childList: true, subtree: true });
        }

        // Cleanup observer on component unmount or when chartRef changes
        return () => {
            observer.disconnect();
        };
    }, [chartRef]);

    return (
        <div className="flex h-full transition-all duration-300 overflow-hidden">
            {/* Left section */}
            <div
                className={`flex flex-col gap-10 flex-grow transition-all duration-300 ${isSidebarOpen ? 'w-full' : 'w-full'
                    }`}
            >
                <div className="flex flex-col px-4">
                    <div className={cn("flex items-center", isSvgAvailable ? "justify-between" : "justify-end")}>
                        {isSvgAvailable && (
                            <Button size="sm" className="flex items-center justify-center gap-2" variant="outline" onClick={handlePlotExport}>
                                <DownloadIcon className="h-4 w-4" />
                                Export
                            </Button>
                        )}
                        <Button
                            variant="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            {isSidebarOpen ? (
                                <MenuOpenIcon className="w-6 h-6 transform rotate-180" />
                            ) : (
                                <MenuOpenIcon className="w-6 h-6" />
                            )}
                        </Button>
                    </div>
                    <div className="flex flex-grow h-full w-full items-center justify-center" ref={chartRef} />
                </div>
                <SpreadSheet
                    sources={dataSources}
                    data={data}
                    onDataChange={(value) => setData(value)}
                />
            </div>

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
                        <ChartForm data={data} chartRef={chartRef} />
                    </div>
                )}
            </div>
        </div>
    );
}

