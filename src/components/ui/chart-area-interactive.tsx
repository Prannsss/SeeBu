"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatBucket } from "@/lib/ph-date"

/**
 * Reports over time. `chartData` comes from the analytics API already zero-filled for the
 * selected range; `date` is a "YYYY-MM-DD" day or a "YYYY-MM" month bucket.
 */
export function ChartAreaInteractive({
  title = "Area Chart",
  description = "Showing data over time",
  chartData = [],
  chartConfig = {},
  headerAction,
  className = "",
}: {
  title?: string
  description?: React.ReactNode
  chartData?: Array<{ date: string } & Record<string, number | string>>
  chartConfig?: ChartConfig
  headerAction?: React.ReactNode
  className?: string
}) {
  // Draw totals first so "resolved" overlaps on top of them.
  const chartKeys = React.useMemo(
    () =>
      Object.keys(chartConfig)
        .filter((k) => k !== "views" && k !== "label")
        .sort((a, b) => Number(a === "resolved") - Number(b === "resolved")),
    [chartConfig]
  )

  return (
    <Card className={"flex flex-col border-slate-200 dark:border-slate-800 shadow-sm w-full " + className}>
      <CardHeader className="flex flex-col gap-3 space-y-0 border-b border-slate-100 dark:border-slate-800 py-5 sm:flex-row sm:items-center">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {headerAction && <div className="shrink-0 self-start sm:self-auto">{headerAction}</div>}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1 flex items-stretch">
        <ChartContainer config={chartConfig} className="aspect-auto min-h-[300px] w-full">
          <AreaChart data={chartData} accessibilityLayer margin={{ left: 0, right: 8 }}>
            <defs>
              {chartKeys.map((key) => (
                <linearGradient key={key} id={"fill" + key} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={"var(--color-" + key + ")"} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={"var(--color-" + key + ")"} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => formatBucket(String(value))}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent labelFormatter={(value) => formatBucket(String(value), true)} indicator="dot" />}
            />
            {chartKeys.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="monotone"
                fill={"url(#fill" + key + ")"}
                stroke={"var(--color-" + key + ")"}
                strokeWidth={2}
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
