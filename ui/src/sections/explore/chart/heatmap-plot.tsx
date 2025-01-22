import { z } from "zod";
import * as Plot from "@observablehq/plot";
import { FormProvider, useForm } from "react-hook-form";
import FormSelect from "@/components/form/form-select";
import FormSwitch from "@/components/form/form-switch";
import { cn, getCssVariableValue } from "@/lib/utils";
import { useEffect } from "react";
import { generateBasePlot, getColumnOptions } from "./common";
import { zodResolver } from "@hookform/resolvers/zod";

// Heatmap-specific schema
const heatmapPlotSchema = z.object({
    x: z.string().min(1, "X Axis is required"),
    y: z.string().min(1, "Y Axis is required"),
    fill: z.string().min(1, "Fill is required"),
    tip: z.boolean().optional(),
});

const generateHeatmapPlot = (data: any, formData: any, chartRef: React.RefObject<HTMLDivElement>) => {
    generateBasePlot(data, formData, chartRef, {
        color: { legend: true },
        marks: [Plot.cell(data, formData as Plot.CellOptions)],
    });
};

type FormDefaults = {
    x: string;
    y: string;
    fill: string;
    tip: boolean;
}

interface HeatmapPlotProps extends React.HTMLProps<HTMLFormElement> {
    data: any;
    formDefaults: FormDefaults;
    chartRef: React.RefObject<HTMLDivElement>
}

const HeatmapPlot: React.FC<HeatmapPlotProps> = ({ data, formDefaults, chartRef, className, ...props }) => {
    const columnOptions = getColumnOptions(data);

   
    const methods = useForm({
        mode: "onChange",
        resolver: zodResolver(heatmapPlotSchema),
        defaultValues: formDefaults
    });

    const { watch, formState } = methods;
    const formData = watch();

    useEffect(() => {
        if (formState.isValid && !formState.isValidating) {
            generateHeatmapPlot(data, formData, chartRef);
        } 
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, formState]);

    
    useEffect(() => {
        generateHeatmapPlot(data, formData, chartRef);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <FormProvider {...methods}>
            <form className={cn("flex flex-col gap-4", className)} {...props}>
                <FormSelect name="x" label="X Axis" options={columnOptions} placeholder="Select X axis" />
                <FormSelect name="y" label="Y Axis" options={columnOptions} placeholder="Select Y axis" />
                <FormSelect name="fill" label="Fill" options={columnOptions} placeholder="Select Fill" />
                <FormSwitch name="tip" label="Tip" description="Enable or disable tooltips" />
            </form>
        </FormProvider>
    );
};

export default HeatmapPlot;
