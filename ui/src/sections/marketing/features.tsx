'use client'

import { Chart, MagnifyingGlass } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { WorkflowIcon } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";
import { HiLightningBolt } from "react-icons/hi";

interface FeatureCardProps {
    color: string;
    heading: string;
    highlight: string;
    details: string;
    icon: any;
    [x: string]: any;
}

function FeatureCard({ color, heading, highlight, details, icon, rest }: FeatureCardProps) {
    const { theme } = useTheme();

    const sharedStyles = { fontSize: '3em', }
    const lightStyle = { ...sharedStyles, color }
    const darkStyle = { ...sharedStyles, color: 'white' }

    return (
        <Card {...rest} className="bg-card p-6">
            <CardContent>
                <div className="flex flex-col items-center gap-4 py-10 ">
                    {icon}
                    <h3 className="font-bold text-foreground text-2xl">{heading} </h3>
                    <p className="font-bold text-sm">
                        <span style={{ color }}>{highlight}</span> {details}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

function FeatureCards() {

    const features = [
        {
            heading: "Automated Workflows",
            highlight: "Streamline",
            details: "your pathogen detection processes with our fully automated workflows.",
            color: "#76C7C0",
            icon: <WorkflowIcon />

        },
        {
            heading: "Data Exploration",
            highlight: "Harness",
            details: "Harness the power of all your samples. Track historical data sets and gain valuable insights",
            color: "#29c463",
            icon: <MagnifyingGlass />
        },
        {
            heading: "Real Time Updates",
            highlight: "Never",
            details: "miss a second. Get real-time updates for your analyses.",
            color: "#F4B400",
            icon: <HiLightningBolt />
        },
        {
            heading: "Visualizations",
            highlight: "Leverage",
            details: "our built-in analytics tools for deeper insights and faster results.",
            color: "#2862ea",
            icon: <Chart />
        },
    ]

    return (
        <>
            {features.map((feature, index) => (
                <FeatureCard
                    key={index}
                    id={`${feature.heading.toLocaleLowerCase()}-feature`}
                    heading={feature.heading}
                    highlight={feature.highlight}
                    details={feature.details}
                    color={feature.color}
                    icon={feature.icon}
                />
            ))}
        </>
    );
}

export default function Features() {
    return (
        <div className="flex flex-col gap-6 py-40">
            <h2 className="font-bold text-center font-heading text-3xl sm:text-5xl md:text-6xl">
                What we provide
            </h2>
            <div className="mx-auto grid text-center gap-8 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 px-10 py-5">
                <FeatureCards />
            </div>
        </div>
    )
}