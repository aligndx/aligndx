import { cn } from "@/lib/utils";
import { HTMLAttributes, useEffect, useState } from "react";
import { useDuckDb } from "duckdb-wasm-kit";
import { toast } from "@/components/ui/sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"; // Importing shadcn table components
import { ScrollArea } from "@/components/ui/scroll-area"; // Importing shadcn scrollarea
import { Button } from "@/components/ui/button";
import { DownloadIcon, InformationCircle } from '@/components/icons'
import { handleExport, insertRemoteFile } from "./actions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export interface Source {
    id: string;  // Table name
    url: string; // URL for the source file
}

interface SpreadSheetProps extends HTMLAttributes<HTMLDivElement> {
    sources?: Source[];  // Array of sources with id and url
    data: any[];  // Final data array (after merge/join), passed without id
    onDataChange: (value: any[]) => void;  // Callback to pass final joined data
}

const columnMetadata = {
    name: "Scientific name of the species",
    taxonomy_id: "Unique identifier for the taxonomy",
    taxonomy_lvl: "Level of the taxonomy (e.g., species, genus)",
    sample: "Sample identifier",
    abundance_num: "Numerical abundance of the species",
    abundance_frac: "Fractional abundance of the species"
};

export default function SpreadSheet({
    sources,
    data = [],  // Default data to an empty array
    onDataChange,
    className,
}: SpreadSheetProps) {
    const { db, loading, error } = useDuckDb();
    const [metadata, setMetadata] = useState<any>(columnMetadata)

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


    if (loading || data.length == 0) return  <SpreadSheetSkeleton/>;


    const renderContent = (
        <>
            <header className="flex items-center justify-end p-4">
                <Button size="sm" className="flex items-center justify-center gap-2" variant="outline" onClick={() => db && sources && handleExport(db, sources[0].id)}>
                    <DownloadIcon className="h-4 w-4" />
                    Export
                </Button>
            </header>
            <div className="flex h-full">
                <ScrollArea className="w-0 flex-1 whitespace-nowrap max-h-600px]" orientation="both">
                    <Table> {/* Ensures table fills available width */}
                        <TableHeader>
                            <TableRow>
                                {data.length > 0 && Object.keys(data[0]).map((col) => (
                                    <TableHead key={col}>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center">
                                                        {col}
                                                        <span className="cursor-pointer">
                                                            <Button variant="icon"  >
                                                                <InformationCircle className="h-4" />
                                                            </Button>
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>


                                                <TooltipContent className="p-2 text-sm">
                                                    {metadata[col] || "No description available"}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableHead>
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
                </ScrollArea>
            </div>
        </>
    );

    // Only render the content if there is data to display
    return (
        <div className={cn("flex flex-col h-full ", className)}>
            {renderContent}
        </div>
    );
}

function SpreadSheetSkeleton() {
    return (
        <div className="flex flex-col gap-4 p-4 w-full">
            <div className="flex justify-end">
                <Skeleton className="w-32 h-10" />
            </div>
            <SpreadSheetHeaderSkeleton />
            <Skeleton className="w-full h-16" />
            <Skeleton className="w-full h-16" />
            <Skeleton className="w-full h-16" />
            <Skeleton className="w-full h-16" />
            <Skeleton className="w-full h-16" />
            <Skeleton className="w-full h-16" />
            <Skeleton className="w-full h-16" />
        </div>
    )
}

function SpreadSheetHeaderSkeleton() {
    return (
        <div className="flex flex-row gap-5">
            <Skeleton className="w-36 h-4" />
            <Skeleton className="w-36 h-4" />
            <Skeleton className="w-36 h-4" />
            <Skeleton className="w-36 h-4" />
            <Skeleton className="w-36 h-4" />
            <Skeleton className="w-36 h-4" />
            <Skeleton className="w-32 h-4" />
        </div>
    )
}