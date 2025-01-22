import { z } from "zod";
import * as Plot from "@observablehq/plot";
import { FormProvider, useForm } from "react-hook-form";
import FormSelect from "@/components/form/form-select";
import FormSwitch from "@/components/form/form-switch";
import FormColorSelect from "@/components/form/form-color-select";
import { cn, getCssVariableValue } from "@/lib/utils";
import { useEffect } from "react";
import { generateBasePlot, getColumnOptions } from "./common";
import { zodResolver } from "@hookform/resolvers/zod";

// Bar-specific schema
const barPlotSchema = z.object({
    x: z.string().min(1, "X Axis is required"),
    y: z.string().min(1, "Y Axis is required"),
    fill: z.string().optional(),
    tip: z.boolean().optional(),
});

const generateBarPlot = (data: any, formData: any, chartRef: React.RefObject<HTMLDivElement>) => {
    generateBasePlot(data, formData, chartRef, {
        marks: [Plot.barY(data, formData as Plot.BarYOptions)], // Bar-specific mark
        color: { legend: true },

    });
};

type FormDefaults = {
    x: string;
    y: string;
    fill: string;
    tip: boolean;
}

interface BarPlotProps extends React.HTMLProps<HTMLFormElement> {
    data: any;
    formDefaults: FormDefaults;
    chartRef: React.RefObject<HTMLDivElement>
}

const BarPlot: React.FC<BarPlotProps> = ({ data, formDefaults, chartRef, className, ...props }) => {
    const columnOptions = getColumnOptions(data);

    const methods = useForm({
        mode: "onChange",
        resolver: zodResolver(barPlotSchema),
        defaultValues: formDefaults
    });
    const { watch, formState } = methods;
    const formData = watch();

    useEffect(() => {
        if (formState.isValid && !formState.isValidating) {
            generateBarPlot(data, formData, chartRef);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, formState]);

    useEffect(() => {
        generateBarPlot(data, formData, chartRef);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <FormProvider {...methods}>
            <form className={cn("flex flex-col gap-4", className)} {...props}>
                <FormSelect name="x" label="X Axis" options={columnOptions} placeholder="Select X axis" />
                <FormSelect name="y" label="Y Axis" options={columnOptions} placeholder="Select Y axis" />
                <FormSelect name="fill" label="Color (Fill)" options={columnOptions} placeholder="Select Fill variable" />
                {/* <FormColorSelect name="fill" label="Color (Fill)" /> */}
                <FormSwitch name="tip" label="Tip" description="Enable or disable tooltips" />
            </form>
        </FormProvider>
    );
};

export default BarPlot;
