"use client";

import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
} from "recharts";
import {
  Card as BaseCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

interface TaxonRecord {
  name: string;
  taxonomy_id: number;
  taxonomy_lvl: string;
  sample: string;
  abundance_num: bigint;
  abundance_frac: number;
  submission: string;
}

interface TopTaxaChartProps extends React.HTMLAttributes<HTMLDivElement> {
  records: TaxonRecord[];
}

interface SampleTaxaData {
  sample: string;
  [taxon: string]: number | string | undefined;
}

const colorPalette = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "lightgray", // color for "other"
];

export default function TopTaxaStackedBarChart({
  records,
  className,
  ...props
}: TopTaxaChartProps) {
  // Determine global top 5 taxa using abundance_num
  const top5TaxaGlobal = useMemo(() => {
    const taxaTotals = new Map<string, bigint>();
    records.forEach(record => {
      taxaTotals.set(
        record.name,
        (taxaTotals.get(record.name) || BigInt(0)) + record.abundance_num
      );
    });
    const sortedTaxa = Array.from(taxaTotals.entries())
      .sort(([, aTotal], [, bTotal]) => (bTotal > aTotal ? 1 : -1))
      .map(([taxon]) => taxon);
    return sortedTaxa.slice(0, 5);
  }, [records]);

  // Use global top 5 taxa to construct chart data using abundance_frac
  const { chartData, top5Taxa } = useMemo(() => {
    const groupedBySample: Record<string, TaxonRecord[]> = {};
    records.forEach(record => {
      if (!groupedBySample[record.sample]) {
        groupedBySample[record.sample] = [];
      }
      groupedBySample[record.sample].push(record);
    });

    const data: SampleTaxaData[] = [];
    // Use the previously determined global top5Taxa
    const top5 = top5TaxaGlobal;

    for (const sample in groupedBySample) {
      const sampleRecords = groupedBySample[sample];
      const entry: SampleTaxaData = { sample };
      let sumTop5Fraction = 0;

      // For each top 5 taxon, find its fraction in the current sample
      top5.forEach(taxon => {
        const record = sampleRecords.find(r => r.name === taxon);
        const frac = record ? record.abundance_frac : 0;
        entry[taxon] = frac;
        sumTop5Fraction += frac;
      });

      // Assign the remainder to "other", ensuring non-negative
      entry["other"] = Math.max(0, 1 - sumTop5Fraction);

      data.push(entry);
    }

    return { chartData: data, top5Taxa: top5 };
  }, [records, top5TaxaGlobal]);

  // Construct dynamic ChartConfig for top 5 taxa and "other"
  const dynamicConfig = useMemo(() => {
    const config: ChartConfig = {};
    top5Taxa.forEach((taxon, index) => {
      config[taxon] = {
        label: taxon,
        color: colorPalette[index] || "gray",
      };
    });
    // Add configuration for "other"
    config["other"] = {
      label: "Other",
      color: colorPalette[5] || "gray",
    };
    return config;
  }, [top5Taxa]);

  return (
    <BaseCard className={cn("flex flex-col", className)} {...props}>
     <CardHeader>
        <CardTitle className="text-md">Top 5 Taxa per Sample</CardTitle>
        <CardDescription>
          Stacked bar chart of top taxa by abundance fraction, with Other representing the remainder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={dynamicConfig} className="w-full">
          <BarChart data={chartData} barCategoryGap={16}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="sample"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {top5Taxa.map((taxon) => (
              <Bar
                key={taxon}
                dataKey={taxon}
                stackId="a"
                fill={dynamicConfig[taxon]?.color || "gray"}
              />
            ))}
            <Bar
              key="other"
              dataKey="other"
              stackId="a"
              fill={dynamicConfig["other"]?.color || "gray"}
            />
            <ChartLegend content={<ChartLegendContent className="flex flex-col items-start" />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </BaseCard>
  );
}
