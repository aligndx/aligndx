import * as Plot from "@observablehq/plot";

// Utility Function to measure the width of text in pixels
const measureTextWidth = (text: string, fontSize = "12px", fontFamily = "Arial") => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return 0;
    context.font = `${fontSize} ${fontFamily}`;
    return context.measureText(text).width;
};

// Utility Function to calculate bottom margin and rotation based on x-axis labels
const calculateXMargin = (xAxisLabels: string[], containerWidth = 0, xTitlePadding = 0) => {
    const longestLabel = xAxisLabels.reduce((a, b) => (a.length > b.length ? a : b), "");
    const labelWidth = measureTextWidth(longestLabel);

    let tickRotation = 0;
    const maxLabelWidthPerTick = containerWidth / xAxisLabels.length;

    if (labelWidth > maxLabelWidthPerTick) {
        tickRotation = -45; // Rotate if the label is too long
    }

    const marginBottom =
        tickRotation !== 0
            ? Math.abs(labelWidth * Math.sin((tickRotation * Math.PI) / 180)) + 40
            : 40;

    return { marginBottom: marginBottom + xTitlePadding, tickRotation };
};

// Utility Function to calculate left margin based on y-axis labels
const calculateYMargin = (yAxisLabels: string[], yTitlePadding = 0) => {
    const longestLabel = yAxisLabels.reduce((a, b) => (a.length > b.length ? a : b), "");
    const labelWidth = measureTextWidth(longestLabel);

    // For simplicity, we assume no rotation for y-axis labels
    const marginLeft = labelWidth + 20; // Adding buffer space

    return { marginLeft: marginLeft + yTitlePadding };
};

// Utility Function to calculate combined margins for both axes
const calculateMargins = (
    xAxisLabels: string[],
    yAxisLabels: string[],
    containerWidth: number,
    xTitlePadding = 0,
    yTitlePadding = 0
) => {
    const xMargins = calculateXMargin(xAxisLabels, containerWidth, xTitlePadding);
    const yMargins = calculateYMargin(yAxisLabels, yTitlePadding);

    return {
        ...xMargins,
        ...yMargins,
    };
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

    // Extract axis labels
    const xAxisLabels = data.map((row: any) => row[formData.x]);
    const yAxisLabels = data.map((row: any) => String(row[formData.y]));

    const margins = calculateMargins(xAxisLabels, yAxisLabels, containerWidth);

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