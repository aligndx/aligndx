import AnimatedShinyText from "@/components/ui/animated-shiny-text";
import { buttonVariants } from "@/components/ui/button";
import GradualSpacing from "@/components/ui/gradual-spacing";
import { cn } from "@/lib/utils";
import { routes } from "@/routes";
import Link from "next/link";

export default function Hero() {
    return (
        <div className="relative flex flex-col text-center gap-10 py-40 overflow-hidden">
            <AnimatedShinyText className="inline-flex items-center justify-center transition ease-out">
                Introducing AlignDx.
            </AnimatedShinyText>
            <GradualSpacing
                className="font-display text-center text-4xl font-bold -tracking-wider md:text-6xl lg:text-7xl md:leading-[5rem] "
                text="Transform Surveillance."
            />
            <h1>Your Complete Platform for Pathogen Detection.</h1>

            <div className="flex justify-center z-10">
                <Link
                    href={routes.auth.signup}
                    className={cn(
                        buttonVariants({ variant: "gooeyLeft", size: "sm" }),
                        "font-medium transition-colors"
                    )}
                >
                    Get Started Now
                </Link>
            </div>
        </div>
    );
}
