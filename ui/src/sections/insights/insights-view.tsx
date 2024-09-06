'use client';

import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import { useEffect, useRef, useState, useCallback } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export default function InsightsView() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [data, setData] = useState<d3.DSVParsedArray<any> | undefined>(undefined);
    const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });

    useEffect(() => {
        // Fetch the CSV data
        d3.csv("/gistemp.csv", d3.autoType)
            .then((loadedData) => {
                setData(loadedData);
            })
            .catch(error => {
                console.error("Error fetching data:", error);
            });
    }, []);

    const drawPlot = useCallback(() => {
        if (!data || !containerRef.current) return;

        // Store the current container ref in a variable to avoid issues in the cleanup function
        const container = containerRef.current;

        // Clear previous plot if exists
        container.innerHTML = "";

        // Create the bar plot
        const plot = Plot.plot({
            x: {
                label: "Year",
                tickRotate: -45, // Rotate tick labels for better readability
            },
            y: {
                grid: true,
                label: "Temperature Anomaly (°C)"
            },
            marks: [
                Plot.barY(data, { x: "Year", y: "J-D", fill: "J-D", tip: true }) // Create a bar plot with Year on x-axis and J-D on y-axis
            ],
            color: {
                scheme: "burd" // Color scheme for the bars
            },
            height: dimensions.height, // Use dynamic height
            width: dimensions.width   // Use dynamic width
        });

        // Append the plot to the container
        container.appendChild(plot);

        // Cleanup function to remove the plot
        return () => {
            container.removeChild(plot);
        };
    }, [data, dimensions]);

    useEffect(() => {
        drawPlot();
    }, [drawPlot]);

    // Set up ResizeObserver to monitor container size
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.contentBoxSize) {
                    setDimensions({
                        width: entry.contentRect.width,
                        height: entry.contentRect.height
                    });
                }
            }
        });

        // resizeObserver.observe(containerRef.current);

        // Clean up observer on component unmount
        return () => resizeObserver.disconnect();
    }, [containerRef]);

    return (
        <div>
            <div className="h-full w-full" ref={containerRef} />
        </div>
    );
}