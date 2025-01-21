'use client'

import { Chart, MagnifyingGlass } from "@/components/icons";
import { BorderBeam } from "@/components/ui/border-beam";
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
            highlight: "Say goodbye",
            details: "to manual tasks. We take complexity out of pathogen detection so you can focus on what truly matters.",
            color: "#76C7C0",
            icon: <WorkflowIcon />

        },
        {
            heading: "Data Exploration",
            highlight: "Unlock",
            details: "the full power of your data. Track historical trends, compare samples, and make informed decisions using advanced data exploration tools.",
            color: "#29c463",
            icon: <MagnifyingGlass />
        },
        {
            heading: "Real Time Updates",
            highlight: "Stay informed",
            details: "with live updates. AlignDx ensures you receive results as they happen, so you're always in the know.",
            color: "#F4B400",
            icon: <HiLightningBolt />
        },
        {
            heading: "Visualizations",
            highlight: "Leverage",
            details: "your data. Use our built-in analytics and visualization tools to gain deeper insights quickly and efficiently",
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
        <div className="flex flex-col gap-6 py-40 ">
            <h2 className="font-bold text-center font-heading text-3xl sm:text-5xl md:text-6xl">
                Packed with features
            </h2>
            <caption>
                From pathogen detection all the way to visualization. Gain complex insights into your data, at your pace.    Designed with researchers in mind, AlignDx streamlines your detection workflows, empowering you to make faster, more informed decisions.
            </caption>
            <div className="mx-auto grid text-center gap-8 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                <FeatureCards />
            </div>
        </div>
    )
}