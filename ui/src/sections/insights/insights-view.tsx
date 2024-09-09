'use client';

import { useState } from 'react';
import { MenuOpenIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import Chart from './chart';
import SpreadSheet from './spread-sheet';
import { Submission } from '@/types/submission'; // Ensure the type is imported
import { SubmissionSelector } from './submission-selector';

export default function InsightsView() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State to toggle sidebar
    const [selectedSubmissions, setSelectedSubmissions] = useState<Submission[]>([]); // State to store the selected submissions (Submission objects)

    return (
        <div className="flex h-full transition-all duration-300 overflow-hidden">
            {/* Left section */}
            <div
                className={`flex flex-col flex-grow transition-all duration-300 ${isSidebarOpen ? 'w-full md:w-2/3' : 'w-full'
                    }`}
            >
                <Chart />

                <SpreadSheet />
            </div>

            {/* Sidebar Toggle Button */}
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

            {/* Sidebar */}
            <div
                className={`transition-all duration-300 ${isSidebarOpen ? 'border w-[350px]' : 'w-0'
                    } overflow-hidden`}
            >
                {isSidebarOpen && (
                    <div className="flex flex-col gap-4 p-4 pt-10 ">
                        <h1 className="text-xl font-bold">Data</h1>
                        <SubmissionSelector
                            value={selectedSubmissions}
                            onChange={(newValues) => setSelectedSubmissions(newValues)}
                            multiple />
                        <p>
                            Selected Submissions: {selectedSubmissions.length ? selectedSubmissions.map(sub => sub.name).join(", ") : "None"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
