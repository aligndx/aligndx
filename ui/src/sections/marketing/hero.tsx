'use client'

import AnimatedShinyText from "@/components/ui/animated-shiny-text";
import { buttonVariants } from "@/components/ui/button";
import GradualSpacing from "@/components/ui/gradual-spacing";
import { cn } from "@/lib/utils";
import { routes } from "@/routes";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";

{/* Import the necessary components */ }
import 'next/image';

export default function Hero() {
    const { theme } = useTheme();
    return (
        <div className="relative flex flex-col text-center gap-10 py-40 max-h-screen">
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

            {/* Image Section */}
            <div className="relative w-full overflow-hidden">
                <Image
                    src={theme === "light" ? "/marketing/hero-light.png" : "/marketing/hero-dark.png"}
                    alt="dashboard-screenshot"
                    layout="responsive"
                    width={1000}
                    height={1000}
                    objectFit="cover"
                    objectPosition="top"  // Ensures the top part of the image remains visible
                    className="rounded-lg shadow-lg"
                />

                {/* Gradient Overlay with Opacity */}
                <div className="absolute bottom-0 w-full h-[60%] bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
}
