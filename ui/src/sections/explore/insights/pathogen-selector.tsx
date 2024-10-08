import FormSelect from "@/components/form/form-select";
import { APDB, APDB_RAW } from "@/config-global";
import { cn } from "@/lib/utils";
import { useDuckDb } from "duckdb-wasm-kit";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { insertRemoteFile } from "./actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface PathogenSelectorProps extends React.HTMLProps<HTMLFormElement> {
    pathogens: string[];
    onPathogensChange: (pathogens: string[]) => void;
}

const panels = [
    { value: "Human Pathogenic Viruses", label: "Human Pathogenic Viruses" },
    { value: "CDC high-consequence viruses", label: "CDC high-consequence viruses" },
    { value: "WHO priority pathogens", label: "WHO priority pathogens" },
];

export function PathogenSelector({ pathogens, onPathogensChange, ...props }: PathogenSelectorProps) {
    const methods = useForm({
        mode: "onChange",
        defaultValues: {
            panel: panels[0].value,
        },
    });
    const { db, loading } = useDuckDb();

    const selectedPanel = methods.watch("panel");

    useEffect(() => {
        const loadTable = async () => {
            if (!db || loading || !selectedPanel) return;

            try {
                await insertRemoteFile(db, APDB_RAW, "apdb");
                const conn = await db.connect();

                const organismArrow = await conn.query(`SELECT organism FROM apdb WHERE "${selectedPanel}" = 'Y'`);
                const organismList = organismArrow.toArray().map((row) => row["Organism"]);
                onPathogensChange(organismList)
                await conn.close();
            } catch (err) {
                console.error(err);
                toast.error("Couldn't generate pathogens");
            }
        };
        // Transform panels into pathogens
        loadTable()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, selectedPanel, loading]);

    const description = (
        <span>
            Select a panel for screening. Generated from the{" "}
            <a href={APDB} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">
                APDB
            </a>.
        </span>
    );


    return (
        <FormProvider {...methods}>
            <form  {...props}>
                <div className="flex">
                    <FormSelect
                        name="panel"
                        label="Pathogen Panel"
                        description={description}
                        options={panels}
                        placeholder="Select a panel"
                    />
                </div>
                <Label>Pathogens</Label>
                <p className={cn("text-sm text-muted-foreground")}>
                    Pathogens from the selected panel.
                </p>
                <ScrollArea type="always" orientation="vertical" className="flex h-[200] max-w-[500px] border p-4">
                    {pathogens.map((pathogen: any, index: number) => (
                        <Badge key={index} className="bg-secondary text-secondary-foreground">
                            {pathogen}
                        </Badge>
                    ))}
                </ScrollArea>

            </form>
        </FormProvider>
    );
}
