import { Combobox } from "@/components/ui/combobox";
import React from "react";
import { useDuckDbQuery } from "duckdb-wasm-kit";
import { Label } from "@/components/ui/label";
import { CONFIG } from "@/config-global";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useBoolean } from "@/hooks/use-boolean";

interface PathogenSelectorProps extends React.HTMLProps<HTMLDivElement> {
    pathogens: Pathogen[]; // now expects an array of Pathogen objects
    onPathogensChange: (pathogens: Pathogen[]) => void;
    showOnlyDetected: boolean;
    toggleShowOnlyDetected: () => void;
}

export interface Pathogen {
    id: string;
    name: string;
}

export interface Panel {
    id: string;
    name: string;
    pathogenIds: Set<string>; // IDs of pathogens in this panel
}

export function PathogenSelector({
    pathogens: selectedPathogens, // now this is an array of Pathogen objects
    onPathogensChange,
    showOnlyDetected,
    toggleShowOnlyDetected,
    ...props
}: PathogenSelectorProps) {
    const [allPathogens, setAllPathogens] = React.useState<Map<string, Pathogen>>(new Map());
    const [panels, setPanels] = React.useState<Map<string, Panel>>(new Map());
    const [selectedPanel, setSelectedPanel] = React.useState<Panel | null>(null);

    // We'll derive selectedPathogenIds from selectedPathogens for internal logic:
    const selectedPathogenIds = React.useMemo(
        () => selectedPathogens.map(p => p.id),
        [selectedPathogens]
    );

    const pathogenSql = `
    SELECT 
        column4 AS id, 
        trim(replace(replace(replace(column5, '[', ''), ']', ''), '''', '')) AS name
    FROM read_csv_auto('${CONFIG.KRAKEN_INDEX}')
    WHERE column3 IN ('S')
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


    const filteredPathogens = React.useMemo(() => {
        const all = Array.from(allPathogens.values());
        all.sort((a, b) => {
            const aSelected = selectedPathogenIds.includes(a.id);
            const bSelected = selectedPathogenIds.includes(b.id);

            // If one is selected and the other isn't, prioritize the selected one
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;

            // Otherwise, sort alphabetically by name
            return a.name.localeCompare(b.name);
        });
        return all;
    }, [allPathogens, selectedPathogenIds]);

    if (loadingPathogens || loadingPanels) {
        return <PathogenSelectorSkeleton />;
    }

    if (pathogenError || panelError) {
        return <div>Error loading data: {pathogenError?.message || panelError?.message}</div>;
    }

    return (
        <div {...props}>
            <Label>Pathogen(s)</Label>
            <p className="text-sm text-muted-foreground">
                Screen individual pathogens or choose from a pre-selected panel.
            </p>
            {selectedPathogens.length > 0 ?
                <div className="flex items-center space-x-2">
                    <Switch id="only-detected" checked={showOnlyDetected} onCheckedChange={toggleShowOnlyDetected} />
                    <Label htmlFor="only-detected">Only detected</Label>
                </div>
                : null}
            <div className="flex gap-2">
                {/* Panels Combobox */}
                <Combobox<Panel>
                    items={Array.from(panels.values())}
                    value={selectedPanel ? [selectedPanel] : []}
                    onChange={(groupArray) => {
                        const newPanel = groupArray[0] || null;
                        setSelectedPanel(newPanel);
                        if (newPanel) {
                            const panelPathogenIds = Array.from(newPanel.pathogenIds);
                            const panelPathogens = panelPathogenIds
                                .map(id => allPathogens.get(id))
                                .filter((p): p is Pathogen => !!p);
                            onPathogensChange(panelPathogens);
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
                    selectAll={false}
                    items={filteredPathogens}
                    value={selectedPathogens}
                    onChange={(newSelection) => {
                        onPathogensChange(newSelection);
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
    );
}
