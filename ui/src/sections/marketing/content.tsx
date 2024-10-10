import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { routes } from "@/routes";
import Link from "next/link";

export default function Content() {
    return (
        <div>
            <div className="relative flex flex-col gap-4 text-center w-3/4 mx-auto">
                <h1 className="text-primary-foreground font-semibold font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
                    Surveillance has never been this easy
                </h1>
                <p className="sm:text-sm md:text-base xl:text-lg text-primary-foreground">
                    AlignDx automates the boring stuff and gets you important insights into your data.
                </p>
                
            <div className="flex justify-center z-10">
                <Link
                    href={routes.auth.signup}
                    className={cn(
                        buttonVariants({ variant: "gooeyLeft", size: "sm" }),
                        "font-medium transition-colors"
                    )}
                >
                    Get Started Today
                </Link>
            </div>
            </div>
        </div>
    )
}
