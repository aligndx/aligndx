import { Boxes } from "@/components/ui/background-boxes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { routes } from "@/routes";
import Link from "next/link";

export default function Hero() {
    return (
        <div className="relative flex flex-col text-center gap-6 py-40 overflow-hidden">
             {/* <Boxes colors={["--slate-500"]} className="opacity-20 z-10" /> */}
            <div className="flex flex-col gap-4 z-10">
                <h1 className="text-primary font-semibold font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Aligning Efforts, Detecting Pathogens
                    </span>
                </h1>
                <h1>Cutting-edge Surveillance for Global Health</h1>
            </div>

            <div className="flex justify-center z-10">
                <Link
                    href={routes.auth.signup}
                    className={cn(
                        buttonVariants({ variant: "default", size: "sm" }),
                        "font-medium transition-colors"
                    )}
                >
                    Get Started Now
                </Link>
            </div>
        </div>
    );
}
