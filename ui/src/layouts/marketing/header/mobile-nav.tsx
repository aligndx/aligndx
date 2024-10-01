import * as React from "react"

import Logo from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/icons";
import { useBoolean } from "@/hooks/use-boolean";

export type NavItem = {
    title: string
    href: string
    disabled?: boolean
}

export type MainNavItem = NavItem


interface MobileNavProps {
    items: MainNavItem[]
    children?: React.ReactNode
}


export function MobileNav({ items, children }: MobileNavProps) {
    const showMobileMenu = useBoolean(false);

    return (
        <Sheet open={showMobileMenu.value} onOpenChange={showMobileMenu.onToggle}>
            <Button
                variant="ghost"
                size="sm"
                onClick={showMobileMenu.onToggle}
            >
                <Menu />
            </Button>

            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle onClick={showMobileMenu.onToggle}><Logo /></SheetTitle>


                    <SheetDescription>
                        <nav className="grid grid-flow-row auto-rows-max text-sm">
                            {items.map((item, index) => (
                                <Link
                                    key={index}
                                    href={item.disabled ? "#" : item.href}
                                    className={cn(
                                        "flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline",
                                        item.disabled && "cursor-not-allowed opacity-60"
                                    )}
                                    onClick={showMobileMenu.onToggle}
                                >
                                    {item.title}
                                </Link>
                            ))}
                        </nav>
                    </SheetDescription>
                </SheetHeader>
            </SheetContent>
        </Sheet>

    )
}

export function MobiledsfNav({ items, children }: MobileNavProps) {
    return (
        <div
            className={cn(
                "fixed inset-0 top-16 right-0 z-50 w-[80%] max-w-md h-[calc(100vh-4rem)] overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-right md:hidden"
            )}
        >
            <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md">
                <Logo />
                <nav className="grid grid-flow-row auto-rows-max text-sm">
                    {items.map((item, index) => (
                        <Link
                            key={index}
                            href={item.disabled ? "#" : item.href}
                            className={cn(
                                "flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline",
                                item.disabled && "cursor-not-allowed opacity-60"
                            )}
                        >
                            {item.title}
                        </Link>
                    ))}
                </nav>
                {children}
            </div>
        </div>
    )
}
