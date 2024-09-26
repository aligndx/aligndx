import { cn } from "@/lib/utils";
import { HTMLAttributes, useEffect, useState } from "react";
import { useDuckDb, exportCsv, initializeDuckDb } from "duckdb-wasm-kit";
import { insertRemoteFile } from "./insert-file";
import { toast } from "@/components/ui/sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"; // Importing shadcn table components
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"; // Importing shadcn scrollarea
import { Button } from "@/components/ui/button";
import { DownloadIcon } from '@/components/icons'
import { Input } from "@/components/ui/input";
import { DuckDBConfig } from "@duckdb/duckdb-wasm";

export interface Source {
    id: string;  // Table name
    url: string; // URL for the source file
}

interface SpreadSheetProps extends HTMLAttributes<HTMLDivElement> {
    sources?: Source[];  // Array of sources with id and url
    data: any[];  // Final data array (after merge/join), passed without id
    onDataChange: (value: any[]) => void;  // Callback to pass final joined data
}

export default function SpreadSheet({
    sources,
    data = [],  // Default data to an empty array
    onDataChange,
    className,
}: SpreadSheetProps) {
    const { db, loading, error } = useDuckDb();
    const [filter, setFilter] = useState("");  // State to hold filter input

    useEffect(() => {
        const loadTable = async () => {
            if (sources?.length && db) {
                try {
                    // Insert all selected sources into DuckDB
                    for (const source of sources) {
                        await insertRemoteFile(db, source.url, source.id);
                    }

                    let result;
                    const conn = await db.connect();

                    if (sources.length === 1) {
                        // If only one source, select all from that table
                        result = await conn.query(`SELECT * FROM ${sources[0].id} LIMIT 100`);
                    } else if (sources.length > 1) {
                        // If multiple sources, dynamically generate JOIN query
                        const joinQuery = generateJoinQuery(sources);
                        result = await conn.query(joinQuery);
                    }

                    // Get the result as an array of rows
                    if (result) {
                        onDataChange(result.toArray());
                    }

                    await conn.close();
                } catch (err) {
                    console.error(err);
                    toast.error("Couldn't load or join the data");
                }
            } else {
                onDataChange([]);
            }
        };

        loadTable();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sources, db]);


    useEffect(() => {
        const config: DuckDBConfig = {
            query: {
                /**
                 * By default, int values returned by DuckDb are Int32Array(2).
                 * This setting tells DuckDB to cast ints to double instead,
                 * so they become JS numbers.
                 */
                castBigIntToDouble: true,
            },
        }
        initializeDuckDb({ config, debug: true });
    }, []);

    // Function to generate a dynamic JOIN query based on the selected sources
    const generateJoinQuery = (sources: Source[]) => {
        // Assuming a common column like `id` for joining, adjust as per your schema
        const joinCondition = "ON table1.id = table2.id"; // Example join condition; adapt as necessary

        const tableNames = sources.map((source, index) => `table${index + 1} AS ${source.id}`).join(', ');
        const joinClauses = sources.slice(1).map((_, index) => `JOIN ${sources[index + 1].id} AS table${index + 2} ${joinCondition}`).join(' ');

        return `SELECT * FROM ${sources[0].id} AS table1 ${joinClauses} LIMIT 100`;
    };

    const handleExport = async () => {
        if (db && sources?.length) {
            try {
                // Call exportCsv to get the File object
                const file = await exportCsv(db, sources[0].id);

                // Create a URL for the File object
                const url = URL.createObjectURL(file);

                // Create an anchor element and trigger a download
                const link = document.createElement("a");
                link.href = url;
                link.download = file.name; // The filename from exportCsv
                document.body.appendChild(link);
                link.click();

                // Clean up the DOM and revoke the object URL
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Error exporting data:", err);
                toast.error("Couldn't export the data");
            }
        }
    };

    if (loading) return <p>Loading ...</p>;

    // Filter the data based on the search input
    const filteredData = data.filter((row) => {
        return Object.values(row).some((value) =>
            String(value).toLowerCase().includes(filter.toLowerCase())
        );
    });

    const renderContent = (
        <>
            <header className="flex items-center justify-between px-4">
                <Button size="sm" className="flex items-center justify-center gap-2" variant="outline" onClick={handleExport}>
                    <DownloadIcon className="h-4 w-4" />
                    Export
                </Button>
                <Input
                    placeholder="Search pathogens..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}  // Update filter state on input change
                />
            </header>
            <div className="flex h-full">
                <ScrollArea className="w-0 flex-1 whitespace-nowrap ">
                    <Table> {/* Ensures table fills available width */}
                        <TableHeader>
                            <TableRow>
                                {filteredData.length > 0 && Object.keys(filteredData[0]).map((col) => (
                                    <TableHead key={col}>{col}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((row: any, rowIndex: number) => (
                                <TableRow key={rowIndex}>
                                    {Object.values(row).map((value: any, colIndex: number) => (
                                        <TableCell key={colIndex}>
                                            {typeof value === 'bigint' ? value.toString() : value}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </>
    );

    // Only render the content if there is data to display
    return (
        <div className={cn("flex flex-col h-full ", className)}>
            {filteredData.length > 0 ? renderContent : null}
        </div>
    );
}
