import * as React from "react"

import Logo from "@/components/logo";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/icons";

interface MobileSideNavProps {
    children: React.ReactNode
    showSideNav: boolean;
    toggleSideNav: () => void;
}


export function MobileSideNav({ children, showSideNav, toggleSideNav }: MobileSideNavProps) {
    return (
        <Sheet open={showSideNav} onOpenChange={toggleSideNav}>
            <SheetHeader>
                <SheetTitle></SheetTitle>
                <SheetDescription></SheetDescription>
            </SheetHeader>
            <SheetContent side="left">
                {children}
            </SheetContent>
        </Sheet>

    )
}