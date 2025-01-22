import { cn, getCssVariableValue } from "@/lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import BarPlot from "./bar-plot";
import HeatmapPlot from "./heatmap-plot";
import BubblePlot from "./bubble-plot";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { handlePlotExport } from "./actions";

interface ChartFormProps extends React.HTMLProps<HTMLDivElement> {
    data: any;
    chartRef: React.RefObject<HTMLDivElement>;
}

const options = [
    { value: "bar", label: "Bar" },
    { value: "bubble", label: "Bubble" },
    { value: "heatmap", label: "Heatmap" },
]

const barDefaults = {
    x: "sample",
    y: "abundance_frac",
    fill: "name",
    tip: true,
}

const bubbleDefaults = {
    x: "sample",
    y: "name",
    r: "abundance_frac",
    fill: getCssVariableValue("--primary"),
    tip: true,
};

const heatmapDefaults = {
    x: "sample",
    y: "name",
    fill: "abundance_frac",
    tip: true,
}



const ChartForm: React.FC<ChartFormProps> = ({ data, chartRef, ...props }) => {
    const [value, setValue] = useState<string>(options[0].value);

    const handleSelectChange = (innerValue: string) => { setValue(innerValue) }

    const renderChart = () => {
        switch (value) {
            case "bar":
                return <BarPlot formDefaults={barDefaults} chartRef={chartRef} data={data} />;
            case "bubble":
                return <BubblePlot formDefaults={bubbleDefaults} chartRef={chartRef} data={data} />;
            case "heatmap":
                return <HeatmapPlot formDefaults={heatmapDefaults} chartRef={chartRef} data={data} />;
            default:
                return null;
        }
    }

    return (
        <div {...props}>
            <Label>Plot Type</Label>
            <Select onValueChange={handleSelectChange} defaultValue={value}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a plot type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {options.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            <SelectSeparator />
            {renderChart()}
            <SelectSeparator />
            <Button variant="outline" onClick={() => handlePlotExport(chartRef)}>Export</Button>
        </div>
    )
}

export default ChartForm;