import { Combobox } from "@/components/ui/combobox";
import React from "react";
import { useDuckDbQuery } from "duckdb-wasm-kit";
import { Label } from "@/components/ui/label";
import { CONFIG } from "@/config-global";
import { Skeleton } from "@/components/ui/skeleton";

interface PathogenSelectorProps extends React.HTMLProps<HTMLDivElement> {
    pathogens: string[]; // array of selected pathogen IDs
    onPathogensChange: (pathogens: string[]) => void;
}

interface Pathogen {
    id: string;
    name: string;
}

interface Panel {
    id: string;
    name: string;
    pathogenIds: Set<string>; // IDs of pathogens in this panel
}

export function PathogenSelector({
    pathogens: selectedPathogenIds,
    onPathogensChange,
    ...props
}: PathogenSelectorProps) {
    const [allPathogens, setAllPathogens] = React.useState<Map<string, Pathogen>>(new Map());
    const [panels, setPanels] = React.useState<Map<string, Panel>>(new Map());
    const [selectedPanel, setSelectedPanel] = React.useState<Panel | null>(null);

    const pathogenSql = `
        SELECT 
            column4 AS id, 
            trim(replace(replace(replace(column5, '[', ''), ']', ''), '''', '')) AS name
        FROM read_csv_auto('${CONFIG.KRAKEN_INDEX}')
        WHERE column3 IN ('S', 'S1', 'S2')
        ORDER BY LOWER(trim(replace(replace(replace(column5, '[', ''), ']', ''), '''', '')));
    `;

    const panelSql = `
        WITH unpivoted_data AS (
            SELECT
                TaxID,
                panel_name,
                panel_value
            FROM read_csv_auto('${CONFIG.APDB_RAW}')
            UNPIVOT (panel_value FOR panel_name IN (
                "COVID-19",
                "Human Pathogenic Viruses",
                "CDC high-consequence viruses",
                "WHO priority pathogens"
            ))
            WHERE panel_value = 'Y'
        )
        SELECT 
            panel_name AS name, 
            array_agg(TaxID) AS pathogenIds
        FROM unpivoted_data
        GROUP BY panel_name;
    `;

    const { arrow: pathogenArrow, loading: loadingPathogens, error: pathogenError } = useDuckDbQuery(pathogenSql);
    const { arrow: panelArrow, loading: loadingPanels, error: panelError } = useDuckDbQuery(panelSql);

    React.useEffect(() => {
        if (pathogenArrow) {
            const rows = pathogenArrow.toArray ? pathogenArrow.toArray() : [];
            const pathogensMap = new Map<string, Pathogen>();
            rows.forEach((row: any) => {
                pathogensMap.set(row.id, { id: row.id, name: row.name });
            });
            setAllPathogens(pathogensMap);
        }
    }, [pathogenArrow]);

    React.useEffect(() => {
        if (panelArrow) {
            const rows = panelArrow.toArray ? panelArrow.toArray() : [];
            const panelsMap = new Map<string, Panel>();
            rows.forEach((row: any) => {
                panelsMap.set(row.name, {
                    id: row.name,
                    name: row.name,
                    pathogenIds: new Set(row.pathogenIds),
                });
            });
            setPanels(panelsMap);
        }
    }, [panelArrow]);

    const selectedPathogens = React.useMemo(() => {
        return Array.from(selectedPathogenIds)
            .map(id => allPathogens.get(id))
            .filter((p): p is Pathogen => Boolean(p)); // Explicitly narrow the type to Pathogen
    }, [selectedPathogenIds, allPathogens]);
    

    const filteredPathogens = React.useMemo(() => {
        if (!selectedPanel) {
            return Array.from(allPathogens.values());
        }
        const pathogensInPanel = new Set(selectedPanel.pathogenIds);
        const result = Array.from(allPathogens.values()).filter(
            p => pathogensInPanel.has(p.id) || selectedPathogenIds.includes(p.id)
        );
        return result;
    }, [selectedPanel, allPathogens, selectedPathogenIds]);

    if (loadingPathogens || loadingPanels) {
        return <PathogenSelectorSkeleton />;
    }

    if (pathogenError || panelError) {
        return <div>Error loading data: {pathogenError?.message || panelError?.message}</div>;
    }

    return (
        <div {...props}>
            <Label>
                Pathogen(s)
            </Label>
            <p className="text-sm text-muted-foreground">
                Select individual pathogens or choose from a pre-selected panel.
            </p>
            <div className="flex">
                {/* Panels Combobox */}
                <Combobox<Panel>
                    items={Array.from(panels.values())}
                    value={selectedPanel ? [selectedPanel] : []}
                    onChange={(groupArray) => {
                        const newPanel = groupArray[0] || null;
                        setSelectedPanel(newPanel);
                        if (newPanel) {
                            const panelPathogenIds = Array.from(newPanel.pathogenIds);
                            onPathogensChange(panelPathogenIds);
                        } else {
                            onPathogensChange([]);
                        }
                    }}
                    multiple={false}
                    title="Select a panel"
                    itemToString={(panel) => panel.name}
                    searchPlaceholder="Search panels..."
                />

                {/* Pathogens Combobox */}
                <Combobox<Pathogen>
                    items={filteredPathogens}
                    value={selectedPathogens}
                    onChange={(newSelection) => {
                        const newPathogenIds = newSelection.map(p => p.id);
                        onPathogensChange(newPathogenIds);
                    }}
                    multiple={true}
                    title="Select pathogen(s)"
                    itemToString={(pathogen) => pathogen.name}
                    searchPlaceholder="Search pathogens..."
                />
            </div>
        </div>
    );
}

function PathogenSelectorSkeleton() {
    return (
        <div className="flex flex-col space-y-3">
            <div className="space-y-2">
                <Skeleton className="h-4 w-[70px] rounded-xl" />
                <Skeleton className="h-4 w-[250px]" />
            </div>
            <div className="flex gap-1">
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-10 w-[200px]" />
            </div>
        </div>

    )
}