'use client'

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface HeaderProps {
    className?: string;
    children?: ReactNode;
}

export default function Header({ className, children }: HeaderProps) {
    return (
        <header className={cn("px-6 py-1 border-b sticky", className)}>
            {children}
        </header>
    )
}