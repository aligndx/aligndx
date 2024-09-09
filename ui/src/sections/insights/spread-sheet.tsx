import { cn } from "@/lib/utils"
import { HTMLAttributes } from "react";

interface SpreadSheetProps extends HTMLAttributes<HTMLDivElement> {
    sources?: string[];
    data?: any;
    onChange?: (value: any) => void;
}

export default function SpreadSheet({ data, onChange, className }: SpreadSheetProps) {
    return (
        <div className={cn("h-full", className)}>
            {data ? 'data' : "No data yet"}
        </div>
    )
}
