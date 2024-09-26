import * as Plot from "@observablehq/plot";

// Utility Function for Margins
export const calculateMargin = (axisLabels: string[], tickRotation = 0, xTitlePadding = 0) => {
    const longestLabel = axisLabels.reduce((a, b) => (a.length > b.length ? a : b), "");
    const labelWidth = longestLabel.length * 13;
    const marginBottom = tickRotation !== 0 ? labelWidth * Math.cos(tickRotation) + 40 : 40;
    return { marginBottom: marginBottom + xTitlePadding};
};

// Utility to create a base plot with rotated tick labels
export const generateBasePlot = (
    data: any,
    formData: any,
    chartRef: React.RefObject<HTMLDivElement>,
    plotOptions: Plot.PlotOptions
) => {
    if (!chartRef.current) return;

    const container = chartRef.current;
    container.innerHTML = ""; // Clear previous plot

    const xAxisLabels = data.map((row: any) => row[formData.x]);
    const margins = calculateMargin(xAxisLabels, -30);

    const plot = Plot.plot({
        ...margins,
        x: { tickRotate: -30 },
        ...plotOptions, // Custom plot options (marks, scales, etc.)
    });

    container.appendChild(plot);
};

// Function to extract column options from the dataset
export const getColumnOptions = (data: any) => {
    const columns = data.length > 0 ? Object.keys(data[0]) : [];
    return columns.map((col) => ({ value: col, label: col }));
};