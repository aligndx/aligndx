import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback } from "react";
import * as Plot from "@observablehq/plot";
import FormSelect from "@/components/form/form-select";
import FormColorSelect from "@/components/form/form-color-select";
import { getCssVariableValue } from "@/lib/utils";
import FormSwitch from "@/components/form/form-switch";

const basePlotOptionsSchema = z.object({
    x: z.string().min(1, "X Axis is required"),
    y: z.string().optional(),  // Optional for some plots
    fill: z.string().optional(),  // Optional fill color
    tip: z.boolean().optional()
});

const barPlotConfigSchema = z.object({
    plotType: z.literal("bar"),
    plotOptions: basePlotOptionsSchema.extend({
        y: z.string().min(1, "Y Axis is required"),  // Override y to be required for bar
    }),
});

const bubblePlotConfigSchema = z.object({
    plotType: z.literal("bubble"),
    plotOptions: basePlotOptionsSchema.extend({
        y: z.string().min(1, "Y Axis is required"),  // Override y to be required for bubble
        r: z.string().min(1, "Radius is required for Bubble Plot"),
        stroke: z.string().optional(),  // Optional stroke color (outline)
    }),
});

const heatmapPlotConfigSchema = z.object({
    plotType: z.literal("heatmap"),
    plotOptions: basePlotOptionsSchema.extend({
        y: z.string().optional(),  // y can be optional for heatmap
        fill: z.string().min(1, "Fill is required for Heatmap"),  // Fill required for heatmap
    }),
});

const plotConfigSchema = z.discriminatedUnion("plotType", [
    barPlotConfigSchema,
    bubblePlotConfigSchema,
    heatmapPlotConfigSchema,
]);

type PlotConfigSchema = z.infer<typeof plotConfigSchema>;

export default function ChartForm({
    data,
    chartRef,
}: {
    data: any;
    chartRef: React.RefObject<HTMLDivElement>;
}) {
    // Extract column names from the dataset
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    const columnOptions = columns.map((col) => ({ value: col, label: col }));

    // Initialize the form with react-hook-form and zod
    const methods = useForm<PlotConfigSchema>({
        mode: "onChange",
        resolver: zodResolver(plotConfigSchema),
        defaultValues: {
            plotType: "bar",
            plotOptions: {
                x: columns[0] || "",
                y: columns[1] || "",
                fill: getCssVariableValue("--primary"),
                tip: true
            },
        },
    });

    const { watch, formState } = methods;
    const plotType = watch("plotType");
    const formData = watch();

    const calculateMargin = (axisLabels: string[], tickRotation = 0, xTitlePadding = 0, yTitlePadding = 0) => {
        const longestLabel = axisLabels.reduce(
            (a, b) => (a.length > b.length ? a : b),
            ""
        );

        // Estimate the width based on character length (approximation, can fine-tune)
        const labelWidth = longestLabel.length * 13; // Assuming ~8px per character

        // Adjust for rotation if there's a tick rotation (e.g., -30 degrees)
        const marginBottom = tickRotation !== 0 ? labelWidth * Math.cos(tickRotation) + 40 : 40;
        const marginLeft = labelWidth
        return {
            marginBottom: marginBottom + xTitlePadding,  // Add padding for the axis title
        };
    };

    const generatePlot = useCallback(
        (formData: PlotConfigSchema) => {
            if (!chartRef.current) return;

            const container = chartRef.current;
            container.innerHTML = ""; // Clear previous plot

            if (data.length === 0) return; // Don't generate plot if data is empty

            let plot;

            const { plotOptions } = formData;

            const xAxisLabels = data.map((row: any) => row[plotOptions.x]);
            const margins = calculateMargin(xAxisLabels, -30); // Use -30 for tick rotation as per the original code

            switch (formData.plotType) {
                case "bar":
                    plot = Plot.plot({
                        ...margins,
                        x: {
                            tickRotate: -30,
                        },
                        marks: [
                            Plot.barY(
                                data,
                                {
                                    ...plotOptions,
                                } as Plot.BarYOptions
                            ),
                        ],
                    });
                    break;
                case "bubble":
                    plot = Plot.plot({
                        ...margins,
                        x: {
                            tickRotate: -30,
                        },
                        marks: [
                            Plot.dot(
                                data,
                                {
                                    ...plotOptions,
                                } as Plot.DotOptions
                            ),
                        ],
                    });
                    break;
                case "heatmap":
                    plot = Plot.plot({
                        ...margins,
                        x: {
                            tickRotate: -30,
                        }, color: { legend: true},
                        marks: [
                            Plot.cell(
                                data,
                                {
                                    ...plotOptions,
                                } as Plot.CellOptions
                            ),
                        ],
                    });
                    break;
            }

            if (plot) {
                container.appendChild(plot);
            }
        },
        [data, chartRef]
    );

    useEffect(() => {
        if (formState.isValid && !formState.isValidating) {
            generatePlot(formData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formState, formData]);

    return (
        <FormProvider {...methods}>
            <form className="flex flex-col gap-4">
                {data.length > 0 ? (
                    <>
                        <h1 className="text-xl font-bold">Chart</h1>

                        <FormSelect
                            name="plotType"
                            label="Plot Type"
                            options={[
                                { value: "bar", label: "Bar" },
                                { value: "bubble", label: "Bubble" },
                                { value: "heatmap", label: "Heatmap" },
                            ]}
                            placeholder="Select a plot type"
                        />

                        <FormSelect
                            name="plotOptions.x"
                            label="X Axis"
                            options={columnOptions}
                            placeholder="Select X axis"
                        />

                        <FormSelect
                            name="plotOptions.y"
                            label="Y Axis"
                            options={columnOptions}
                            placeholder="Select Y axis"
                        />

                        {plotType === "bubble" && (
                            <>
                                <FormSelect
                                    name="plotOptions.r"
                                    label="Radius"
                                    description="Select the column for the bubble size (radius)."
                                    options={columnOptions}
                                    placeholder="Select radius"
                                />
                            </>
                        )}

                        {plotType === "heatmap" &&

                            <FormSelect
                                name="plotOptions.fill"
                                label="Fill"
                                options={columnOptions}
                            />

                        }

                        {plotType != "heatmap" && (
                            <FormColorSelect
                                name="plotOptions.fill"
                                label="Color (Fill)"
                            />
                        )}

                        <h1 className="text-xl font-bold">Display</h1>
                        <FormSwitch name="plotOptions.tip" label="Tip" description="Enable or disable interactive tips" />
                    </>
                ) : null}
            </form>
        </FormProvider>
    );
}
