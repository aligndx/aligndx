import { Combobox } from "@/components/ui/combobox";
import React from "react";
import { useDuckDbQuery } from "duckdb-wasm-kit";

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
    pathogenIds: string[]; // IDs of pathogens in this panel
}

export function PathogenSelector({
    pathogens: selectedPathogenIds,
    onPathogensChange,
    ...props
}: PathogenSelectorProps) {
    const [allPathogens, setAllPathogens] = React.useState<Pathogen[]>([]);
    const [panels, setPanels] = React.useState<Panel[]>([]);
    const [selectedPanel, setSelectedPanel] = React.useState<Panel | null>(null);

    // Define the SQL query for pathogens
    const pathogenSql = `
    SELECT column4 AS id, column5 AS name
    FROM read_csv_auto('https://genome-idx.s3.amazonaws.com/kraken/pluspfp_08gb_20231009/inspect.txt')
    WHERE column3 IN ('S', 'S1', 'S2')
    ORDER BY LOWER(name);
    `;

    // Define the SQL query for panels
    const panelSql = `
    WITH unpivoted_data AS (
        SELECT
            TaxID,
            panel_name,
            panel_value
        FROM read_csv_auto('https://raw.githubusercontent.com/aligndx/apdb/main/panels.csv')
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

    // Fetch pathogens using useDuckDbQuery
    const { arrow: pathogenArrow, loading: loadingPathogens, error: pathogenError } = useDuckDbQuery(pathogenSql);

    // Fetch panels using useDuckDbQuery
    const { arrow: panelArrow, loading: loadingPanels, error: panelError } = useDuckDbQuery(panelSql);

    // Convert the Arrow result for pathogens
    React.useEffect(() => {
        if (pathogenArrow) {
            const rows = pathogenArrow.toArray ? pathogenArrow.toArray() : [];
            const pathogensFromQuery: Pathogen[] = rows.map((row: any) => ({
                id: row.id,
                name: row.name,
            }));
            setAllPathogens(pathogensFromQuery);
        }
    }, [pathogenArrow]);

    // Convert the Arrow result for panels
    React.useEffect(() => {
        if (panelArrow) {
            const rows = panelArrow.toArray ? panelArrow.toArray() : [];
            const panelsFromQuery: Panel[] = rows.map((row: any) => ({
                id: row.name,
                name: row.name,
                pathogenIds: row.pathogenIds,
            }));
            setPanels(panelsFromQuery);
        }
    }, [panelArrow]);

    const selectedPathogens = React.useMemo(() => {
        return allPathogens.filter(p => selectedPathogenIds.includes(p.id));
    }, [selectedPathogenIds, allPathogens]);

    const filteredPathogens = React.useMemo(() => {
        if (!selectedPanel) return allPathogens;
        return allPathogens.filter(p => selectedPanel.pathogenIds.includes(p.id));
    }, [selectedPanel, allPathogens]);

    if (loadingPathogens || loadingPanels) {
        return <div>Loading data...</div>;
    }
    if (pathogenError || panelError) {
        return <div>Error loading data: {pathogenError?.message || panelError?.message}</div>;
    }

    return (
        <div {...props}>
            <div className="flex">
                {/* Panels Combobox */}
                <Combobox<Panel>
                    items={panels}
                    value={selectedPanel ? [selectedPanel] : []}
                    onChange={(groupArray) => {
                        const newPanel = groupArray[0] || null;
                        setSelectedPanel(newPanel);
                        if (newPanel) {
                            const panelPathogens = allPathogens.filter(p =>
                                newPanel.pathogenIds.includes(p.id)
                            );
                            const panelPathogenIds = panelPathogens.map(p => p.id);
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
