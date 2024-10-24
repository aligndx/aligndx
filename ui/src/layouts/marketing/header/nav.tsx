import * as React from "react"
import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"

import { cn } from "@/lib/utils"

import { routes } from "@/routes";
import Logo from "@/components/logo";
import ThemeToggle from "@/layouts/common/theme-toggle";
import { MobileNav } from "./mobile-nav";
import { buttonVariants } from "@/components/ui/button";


interface NavProps {
    items?: any[]
    children?: React.ReactNode
}

export function MainNav({ items, children }: NavProps) {
    const segment = useSelectedLayoutSegment();

    return (
        <div>
            <nav className="hidden md:flex justify-between items-center">
                {/* <div className="flex flex-1 gap-6 justify-start">
                    {items?.map((item, index) => (
                        <Link
                            key={index}
                            href={item.disabled ? "#" : item.href}
                            className={cn(
                                "flex items-center font-medium transition-colors hover:text-foreground/100 sm:text-sm",
                                item.href.startsWith(`/${segment}`)
                                    ? "text-foreground"
                                    : "text-foreground/80",
                                item.disabled && "cursor-not-allowed opacity-80"
                            )}
                        >
                            {item.title}
                        </Link>
                    ))}
                </div> */}
                <Logo full={false} />
                <div className="flex flex-1 justify-end gap-6 items-center">
                    <Link
                        href={routes.auth.signin}
                        className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                        )}
                    >
                        Sign in
                    </Link>
                    <Link
                        href={routes.auth.signup}
                        className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                        )}
                    >
                        Sign Up
                    </Link>
                    <ThemeToggle />
                </div>
            </nav>
            <div className="flex justify-between items-center md:hidden">
                <Logo />
                <div className="flex justify-between items-center ">
                    <ThemeToggle />
                    {items && (
                        <MobileNav items={items} />
                    )}
                </div>
            </div>
        </div>
    )
}
