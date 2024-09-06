'use client';

import { useState } from 'react';
import { Menu, MenuOpenIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import Chart from './chart';
import SpreadSheet from './spread-sheet';

export default function InsightsView() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State to toggle sidebar

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
                className={`transition-all duration-300 ${isSidebarOpen ? 'border w-[300px]' : 'w-0'
                    } overflow-hidden`}
            >
                {isSidebarOpen && (
                    <div className="p-4 ">
                        <h1 className="text-2xl font-bold">Sidebar</h1>
                        <p>This is the sidebar content.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
