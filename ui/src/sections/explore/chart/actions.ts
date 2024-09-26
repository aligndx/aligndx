export const handlePlotExport = (chartRef : any) => {
    if (chartRef.current) {
        const svgElements = chartRef.current.querySelectorAll('svg');

        if (svgElements.length > 0) {
            const serializer = new XMLSerializer();
            let combinedSvgContent = '';
            let totalWidth = 0;
            let totalHeight = 0;

            // Iterate over each SVG element and combine them while preserving their layout
            svgElements.forEach((svgElement: { cloneNode: (arg0: boolean) => SVGElement; getBoundingClientRect: () => any; }, index: any) => {
                const clonedSvgElement = svgElement.cloneNode(true) as SVGElement;
                const svgString = serializer.serializeToString(clonedSvgElement);

                // Get the bounding box for the current SVG
                const bbox = svgElement.getBoundingClientRect();

                // Update total width and height based on bounding box
                totalWidth = Math.max(totalWidth, bbox.x + bbox.width);
                totalHeight = Math.max(totalHeight, bbox.y + bbox.height);

                // Wrap each SVG in a <g> element, translate it to its original position
                combinedSvgContent += `
                    <g transform="translate(${bbox.x}, ${bbox.y})">
                        ${svgString}
                    </g>
                `;
            });

            // Now wrap all SVG content in a single root SVG tag with the proper width and height
            const rootSvg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}">
                    ${combinedSvgContent}
                </svg>
            `;

            // Create a blob from the root SVG string
            const svgBlob = new Blob([rootSvg], { type: "image/svg+xml;charset=utf-8" });
            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(svgBlob);
            downloadLink.download = "chart.svg";
            downloadLink.click();
        }
    }
};

