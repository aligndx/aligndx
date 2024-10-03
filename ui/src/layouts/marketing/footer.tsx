import * as React from "react"

import { cn } from "@/lib/utils"
import Logo from "@/components/logo"
import { siteConfig } from "@/config"

export default function Footer({ className }: React.HTMLAttributes<HTMLElement>) {
    const currentYear = new Date().getFullYear()

    return (
        <footer className={cn(className)}>
            <Logo className="grayscale" />
            <p className="text-xs text-foreground/60">
                Copyright © {currentYear} {siteConfig.name}. All Rights Reserved.
            </p>
        </footer>
    )
}