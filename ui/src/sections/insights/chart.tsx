import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback } from "react";
import * as Plot from "@observablehq/plot";
import FormSelect from "@/components/form/form-select";
import FormColorSelect from "@/components/form/form-color-select";
import { getCssVariableValue } from "@/lib/utils";

// Define the schema using zod with plotOptions and color support
const barPlotConfigSchema = z.object({
    plotType: z.literal("bar"),
    plotOptions: z.object({
        x: z.string().min(1, "X Axis is required"),
        y: z.string().min(1, "Y Axis is required"),
        fill: z.string().optional(),  // Optional color fill
    }),
});

const bubblePlotConfigSchema = z.object({
    plotType: z.literal("bubble"),
    plotOptions: z.object({
        x: z.string().min(1, "X Axis is required"),
        y: z.string().min(1, "Y Axis is required"),
        r: z.string().min(1, "Radius is required for Bubble Plot"),
        fill: z.string().optional(),  // Optional fill color
        stroke: z.string().optional(),  // Optional stroke color (outline)
    }),
});

const heatmapPlotConfigSchema = z.object({
    plotType: z.literal("heatmap"),
    plotOptions: z.object({
        x: z.string().min(1, "X Axis is required"),
        y: z.string().optional(),
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
            },
        },
    });

    const { watch, formState } = methods;
    const plotType = watch("plotType");
    const formData = watch();

    const generatePlot = useCallback(
        (formData: PlotConfigSchema) => {
            if (!chartRef.current) return;

            const container = chartRef.current;
            container.innerHTML = ""; // Clear previous plot

            if (data.length === 0) return; // Don't generate plot if data is empty

            let plot;

            const { plotOptions } = formData;

            switch (formData.plotType) {
                case "bar":
                    plot = Plot.plot({
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
                        color: {legend: true},
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
                    </>
                ) : null}
            </form>
        </FormProvider>
    );
}
