import FormSelect from "@/components/form/form-select";
import { APDB, APDB_RAW } from "@/config-global";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

interface PathogenSelectorProps extends React.HTMLProps<HTMLFormElement> {
    pathogens: string[];
    onPathogenChange: (pathogens: string[]) => void;
}

const panels = [
    { value: "Human Pathogenic Viruses", label: "Human Pathogenic Viruses" },
    { value: "CDC high-consequence viruses", label: "CDC high-consequence viruses" },
    { value: "WHO priority pathogens", label: "WHO priority pathogens" },
];

export function PathogenSelector({ pathogens, onPathogenChange, className, ...props }: PathogenSelectorProps) {
    const methods = useForm({
        mode: "onChange",
        defaultValues: {
            panel: panels[0].value,
        },
    });

    const selectedPanel = methods.watch("panel");

    useEffect(() => {
        if (selectedPanel) {
            onPathogenChange([selectedPanel]);
        }
        console.log("test")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPanel]);

    const description = (
        <div>
            Select a panel for screening. Generated from the{" "}
            <a href={APDB} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">
                APDB
            </a>.
        </div>
    );


    return (
        <FormProvider {...methods}>
            <form className={cn("flex flex-col gap-4", className)} {...props}>
                <FormSelect
                    name="panel"
                    label="Pathogen Panel"
                    description={description}
                    options={panels}
                    placeholder="Select a panel"
                />
            </form>
        </FormProvider>
    );
}
