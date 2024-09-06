import { cn } from "@/lib/utils"
import { HTMLAttributes } from "react";

interface SpreadSheetProps extends HTMLAttributes<HTMLDivElement> {
    data?: string;
}

export default function SpreadSheet({ data, className }: SpreadSheetProps) {
    return (
        <div className={cn("h-full", className)}>
            {data ? data : "No data yet"}
        </div>
    )
}
