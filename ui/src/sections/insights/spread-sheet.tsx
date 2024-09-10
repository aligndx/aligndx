import { cn } from "@/lib/utils";
import { HTMLAttributes, useEffect } from "react";
import { useDuckDb, exportCsv } from "duckdb-wasm-kit";
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

    const renderContent = (
        <>
            <header className="flex justify-end px-4">
                <Button size="sm" className="flex items-center justify-center gap-2" variant="outline" onClick={handleExport}>
                    <DownloadIcon className="h-4 w-4" />
                    Export
                </Button>
            </header>
            <div className="flex h-full">
                <ScrollArea className="w-0 flex-1 whitespace-nowrap ">
                    <Table> {/* Ensures table fills available width */}
                        <TableHeader>
                            <TableRow>
                                {data.length > 0 && Object.keys(data[0]).map((col) => (
                                    <TableHead key={col}>{col}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row: any, rowIndex: number) => (
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
            {data.length > 0 ? renderContent : <p>No data available</p>}
        </div>
    );
}
