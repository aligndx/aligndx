'use client'

import { cn } from "@/lib/utils";
import { MainNav } from "./nav";

interface HeaderProps {
    className: string;
}

export default function Header({ className }: HeaderProps) {
    return (
        <header className={cn("sticky", className)}>
            <MainNav items={[]} />
        </header>
    )
}