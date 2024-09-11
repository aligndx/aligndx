import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback } from "react";
import * as Plot from "@observablehq/plot";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@radix-ui/react-dropdown-menu";

// Define the schema using zod with discriminated union
const barPlotConfigSchema = z.object({
    plotType: z.literal("bar"),
    x: z.string().min(1, "X Axis is required"),
    y: z.string().min(1, "Y Axis is required"),
});

const bubblePlotConfigSchema = z.object({
    plotType: z.literal("bubble"),
    x: z.string().min(1, "X Axis is required"),
    y: z.string().min(1, "Y Axis is required"),
    r: z.string().min(1, "Radius is required for Bubble Plot"),
});

const heatmapPlotConfigSchema = z.object({
    plotType: z.literal("heatmap"),
    x: z.string().min(1, "X Axis is required"),
    y: z.string().optional(),
    fill: z.string().min(1, "Fill is required for Heatmap"),
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
    // Initialize the form with react-hook-form and zod
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState,
        formState: { isValidating, errors },
    } = useForm<PlotConfigSchema>({
        mode: "onChange",
        resolver: zodResolver(plotConfigSchema),
        defaultValues: {
            plotType: "bar",
            x: "name",
            y: "abundance",
        },
    });

    const plotType = watch("plotType");

    const generatePlot = useCallback(
        (formData: PlotConfigSchema) => {
            if (!chartRef.current) return;

            const container = chartRef.current;
            container.innerHTML = ""; // Clear previous plot

            let plot;
            switch (formData.plotType) {
                case "bar":
                    plot = Plot.plot({
                        marks: [Plot.barY(data, formData)],
                    });
                    break;
                case "bubble":
                    plot = Plot.plot({
                        marks: [Plot.dot(data, formData)],
                    });
                    break;
                case "heatmap":
                    plot = Plot.plot({
                        marks: [Plot.cell(data, formData)],
                    });
                    break;
            }
            container.appendChild(plot);
        },
        [data, chartRef]
    );

    const formData = watch();

    // New useEffect to run generatePlot with default values on initial mount
    useEffect(() => {
        if (data && data.length > 0) {
            generatePlot({
                plotType: "bar", // Default plot type
                x: "name",       // Default x-axis field
                y: "abundance",       // Default y-axis field
            });
        }

        return () => {
            if (chartRef.current) {
                chartRef.current.innerHTML = ""; // Clear the chart on unmount
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    useEffect(() => {
        if (formState.isValid && !isValidating) {
            generatePlot(formData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formState, formData, isValidating]);

    const renderContent = (
        <>
            <h1 className="text-xl font-bold">Chart</h1>
            <div className="flex flex-col gap-2">
                <label className="block font-medium text-sm">Plot Type</label>
                <Select
                    onValueChange={(value) => setValue("plotType", value as "bar" | "bubble" | "heatmap")}
                    defaultValue="bar"
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a plot type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="bubble">Bubble</SelectItem>
                        <SelectItem value="heatmap">Heatmap</SelectItem>
                    </SelectContent>
                </Select>
                {errors.plotType && <p className="text-red-500 text-sm">{errors.plotType.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
                <label className="block font-medium text-sm">X axis</label>
                <Input type="text" placeholder="X" {...register("x")} />
                {errors.x && <p className="text-red-500 text-sm">{errors.x.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
                <label className="block font-medium text-sm">Y axis</label>
                <Input type="text" placeholder="Y" {...register("y")} />
                {errors.y && <p className="text-red-500 text-sm">{errors.y.message}</p>}
            </div>

            {plotType === "bubble" && (
                <div className="flex flex-col gap-2">
                    <label className="block font-medium text-sm">Radius</label>
                    <Input type="text" placeholder="Radius" {...register("r")} />
                    {"r" in errors && errors.r && <p className="text-red-500 text-sm">{errors.r.message}</p>}
                </div>
            )}

            {plotType === "heatmap" && (
                <div className="flex flex-col gap-2">
                    <label className="block font-medium text-sm">Fill</label>
                    <Input type="text" placeholder="Fill" {...register("fill")} />
                    {"fill" in errors && errors.fill && <p className="text-red-500 text-sm">{errors.fill.message}</p>}
                </div>
            )}

            <h1 className="text-xl font-bold">Display</h1>
        </>
    )

    return (
        <form className="flex flex-col gap-4">
            {data.length > 0 ? renderContent : null}
        </form>
    );
}
