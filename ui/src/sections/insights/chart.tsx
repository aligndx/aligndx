import { cn } from "@/lib/utils"
import { HTMLAttributes } from "react"

interface ChartProps extends HTMLAttributes<HTMLDivElement>{
    data?: any
    config?: string
}

export default function Chart({ data, config, className }: ChartProps) {
    return (
        <div className={cn("h-full", className)}>
            {data ? "data" : "No data yet"}
        </div>
    )
}