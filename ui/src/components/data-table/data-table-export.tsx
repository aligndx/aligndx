import React from "react";
import { type Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";

interface DataTableExportProps<TData extends Record<string, any>> {
    table: Table<TData>;
    exportFileName?: string; // Optional filename for export
}

export function DataTableExport<TData extends Record<string, any>>({
    table,
    exportFileName = "data-export.csv",
}: DataTableExportProps<TData>) {
    const handleExportCsv = () => {
        const data = table.getCoreRowModel().rows.map((row) => row.original);

        if (data.length === 0) {
            console.warn("No data available to export.");
            return;
        }

        // Convert data to CSV format
        const columnNames = Object.keys(data[0]); // TypeScript knows data[0] is a Record<string, any>
        const csvRows = [
            columnNames.join(","), // Header row
            ...data.map((row) =>
                columnNames.map((col) => `"${String(row[col]).replace(/"/g, '""')}"`).join(",")
            ),
        ];

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

        // Trigger file download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = exportFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`Exported CSV: ${exportFileName}`);
    };

    return (
        <div className="data-table-export">
            <Button className={"flex gap-2"} size={"sm"} variant={"outline"} onClick={handleExportCsv}>
                <DownloadIcon className="h-4 w-4 "/> Export
            </Button>
        </div>
    );
}
