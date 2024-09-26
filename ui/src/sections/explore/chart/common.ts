import * as Plot from "@observablehq/plot";

// Utility Function to measure the width of text in pixels
const measureTextWidth = (text: string, fontSize = "12px", fontFamily = "Arial") => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) return 0;
    
    context.font = `${fontSize} ${fontFamily}`;
    return context.measureText(text).width;
};

// Utility Function for Margins
export const calculateMargin = (axisLabels: string[], containerWidth = 0, xTitlePadding = 0) => {
    const longestLabel = axisLabels.reduce((a, b) => (a.length > b.length ? a : b), "");
    const labelWidth = measureTextWidth(longestLabel);

    let tickRotation = 0;
    const maxLabelWidthPerTick = containerWidth / axisLabels.length;

    if (labelWidth > maxLabelWidthPerTick) {
        tickRotation = -45; // Rotate if the label is too long
    }

    const marginBottom = tickRotation !== 0 ? Math.abs(labelWidth * Math.sin((tickRotation * Math.PI) / 180)) + 40 : 40;
    return { marginBottom: marginBottom + xTitlePadding, tickRotation: tickRotation};
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
    const containerWidth = container.clientWidth; // Get container width

    const xAxisLabels = data.map((row: any) => row[formData.x]);
    const margins = calculateMargin(xAxisLabels, containerWidth);

    const plot = Plot.plot({
        ...margins,
        x: { tickRotate: margins.tickRotation },
        ...plotOptions, // Custom plot options (marks, scales, etc.)
    });

    container.appendChild(plot);
};

// Function to extract column options from the dataset
export const getColumnOptions = (data: any) => {
    const columns = data.length > 0 ? Object.keys(data[0]) : [];
    return columns.map((col) => ({ value: col, label: col }));
};