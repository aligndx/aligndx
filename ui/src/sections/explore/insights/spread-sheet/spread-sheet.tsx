import { cn } from "@/lib/utils";
import { HTMLAttributes} from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DownloadIcon, InformationCircle } from '@/components/icons'
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface SpreadSheetProps extends HTMLAttributes<HTMLDivElement> {
    data: any[];
    loading: boolean;
    metadata: Record<string, any>;
    onExport: () => void;  // Callback to pass final joined data
}

export default function SpreadSheet({
    data = [],  // Default data to an empty array
    onExport,
    loading,
    metadata,
    className,
}: SpreadSheetProps) {
    // Only render the content if there is data to display
    if (loading || data.length == 0) return <SpreadSheetSkeleton />;

    return (
        <div className={cn("flex flex-col h-full ", className)}>
            <header className="flex items-center justify-end p-4">
                <Button size="sm" className="flex items-center justify-center gap-2" variant="outline" onClick={onExport}>
                    <DownloadIcon className="h-4 w-4" />
                    Export
                </Button>
            </header>
            <div className="flex h-full">
                <ScrollArea className="w-0 flex-1 whitespace-nowrap max-h-[500px]" orientation="both">
                    <Table> {/* Ensures table fills available width */}
                        <TableHeader>
                            <TableRow>
                                {data.length > 0 && Object.keys(data[0]).map((col) => (
                                    <TableHead key={col}>
                                        <TooltipProvider delayDuration={100}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center">
                                                        {col}
                                                        <span>
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