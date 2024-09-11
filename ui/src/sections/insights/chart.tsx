import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback } from "react";
import * as Plot from "@observablehq/plot";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Define the schema using zod
const plotConfigSchema = z.object({
    plotType: z.enum(["bar", "bubble", "heatmap"]),
    x: z.string().min(1, "X Axis is required"),
    y: z.string().optional(), // Make Y optional for certain types
    r: z.string().optional(),  // Only for bubble plot
})


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
            y: "",
            r: "",
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
                        marks: [Plot.barY(data, { x: formData.x, y: formData.y })],
                    });
                    break;
                case "bubble":
                    plot = Plot.plot({
                        marks: [Plot.dot(data, { x: formData.x, y: formData.y, r: formData.r })],
                    });
                    break;
                case "heatmap":
                    plot = Plot.plot({
                        marks: [Plot.rect(data, { x: formData.x, y: formData.y, fill: formData.r })],
                    });
                    break;
                default:
                    plot = Plot.plot({
                        marks: [Plot.auto(data, { x: formData.x, y: formData.y })],
                    });
            }
            container.appendChild(plot);

        },
        [data, chartRef]
    );

    const formData = watch();

    useEffect(() => {
        if (formState.isValid && !isValidating) {
            console.log(formData);
            generatePlot(formData);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formState, formData, isValidating]);


    return (
        <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <label className="block font-medium text-sm">
                    Plot Type
                </label>
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
                <label className="block font-medium text-sm  ">Y axis </label>
                <Input type="text" placeholder="Y" {...register("y")} />
                {errors.y && <p className="text-red-500 text-sm">{errors.y.message}</p>}
            </div>

            {plotType === "bubble" && (
                <div className="flex flex-col gap-2">
                    <label className="block font-medium text-sm">Radius</label>
                    <Input type="text" placeholder="Radius" {...register("r")} />
                    {errors.r && <p className="text-red-500 text-sm">{errors.r.message}</p>}
                </div>
            )}
        </form>
    );
}