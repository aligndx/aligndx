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

const bubblePlotSchema = z.object({
    x: z.string().min(1, "X Axis is required"),
    y: z.string().min(1, "Y Axis is required"),
    r: z.string().min(1, "Radius is required"),
    fill: z.string().optional(),
    tip: z.boolean().optional(),
});

const generateBubblePlot = (data: any, formData: any, chartRef: React.RefObject<HTMLDivElement>) => {
    generateBasePlot(data, formData, chartRef, {
        marks: [Plot.dot(data, formData as Plot.DotOptions)], // Bubble-specific mark
    });
};

interface BubblePlotProps extends React.HTMLProps<HTMLFormElement> {
    data: any;
    chartRef: React.RefObject<HTMLDivElement>
}

const BubblePlot: React.FC<BubblePlotProps> = ({ data, chartRef, className, ...props }) => {
    const columnOptions = getColumnOptions(data);

    // Bubble-specific form defaults
    const formDefaults = {
        x: columnOptions[0].value,
        y: columnOptions[1].value,
        r: columnOptions[2].value,
        fill: getCssVariableValue("--primary"),
        tip: true,
    };

    const methods = useForm({
        mode: "onChange",
        resolver: zodResolver(bubblePlotSchema),
        defaultValues: formDefaults
    });
    const { watch, formState } = methods;
    const formData = watch();

    useEffect(() => {
        if (formState.isValid && !formState.isValidating) {
            generateBubblePlot(data, formData, chartRef);
        } 
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, formState]);

    
    useEffect(() => {
        generateBubblePlot(data, formData, chartRef);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <FormProvider {...methods}>
            <form className={cn("flex flex-col gap-4", className)} {...props}>
                <FormSelect
                    name="x"
                    label="X Axis"
                    options={columnOptions}
                    placeholder="Select X axis"
                />
                <FormSelect
                    name="y"
                    label="Y Axis"
                    options={columnOptions}
                    placeholder="Select Y axis"
                />
                <FormSelect
                    name="r"
                    label="Radius"
                    description="Select the column for the bubble size (radius)."
                    options={columnOptions}
                    placeholder="Select radius"
                />
                <FormColorSelect
                    name="fill"
                    label="Color (Fill)"
                />
                <FormSwitch
                    name="tip"
                    label="Tip"
                    description="Enable or disable tooltips"
                />
            </form>
        </FormProvider>
    );
};

export default BubblePlot;
