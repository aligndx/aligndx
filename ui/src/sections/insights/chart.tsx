import { cn } from "@/lib/utils"
import { HTMLAttributes } from "react"
import { useEffect, useRef, useState, useCallback } from "react";
import * as Plot from "@observablehq/plot";

interface ChartProps extends HTMLAttributes<HTMLDivElement> {
  data?: any;
  plotType?: 'bar' | 'bubble' | 'heatmap';  // Add plot types as needed
  config?: { [key: string]: any };  // Configuration for x, y, r, etc.
}

export default function Chart({ data, plotType, config, className }: ChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const drawPlot = useCallback(() => {
    if (!data || !containerRef.current) return;

    const container = containerRef.current;

    // Clear previous plot
    container.innerHTML = "";

    // Create the plot based on the plotType
    let plot;

    switch (plotType) {
      case 'bar':
        plot = Plot.plot({
          marks: [
            Plot.barY(data, { x: config?.x, y: config?.y })  // x and y config for bar plot
          ],
        });
        break;

      case 'bubble':
        plot = Plot.plot({
          marks: [
            Plot.dot(data, { x: config?.x, y: config?.y, r: config?.r })  // x, y, and r config for bubble plot
          ],
        });
        break;

      case 'heatmap':
        plot = Plot.plot({
          marks: [
            Plot.rect(data, { x: config?.x, y: config?.y, fill: config?.fill })  // x, y, and fill for heatmap
          ],
        });
        break;

      // Add more cases for other plot types here...

      default:
        plot = Plot.plot({
          marks: [Plot.auto(data, { x: config?.x, y: config?.y })]  // Default fallback
        });
    }

    // Append the plot to the container
    container.appendChild(plot);

    // Cleanup function to remove the plot when necessary
    return () => {
      container.removeChild(plot);
    };
  }, [data, plotType, config]);

  useEffect(() => {
    drawPlot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, plotType, config]);

  return (
    <div className={cn("h-full", className)}>
      {data && data.length > 0 ?
        <div className="h-full w-full" ref={containerRef} />
        : null}
    </div>
  );
}