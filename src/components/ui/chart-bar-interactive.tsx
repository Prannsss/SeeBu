"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export function ChartBarInteractive({
  title = "Bar Chart",
  description = "Showing data by category",
  chartData = [],
  chartConfig = {},
  className = "",
}: {
  title?: string
  description?: string
  chartData?: any[]
  chartConfig?: ChartConfig
  className?: string
}) {
  const chartKeys = Object.keys(chartConfig || {}).filter(k => k !== "views" && k !== "label")

  if (!chartData || chartData.length === 0) {
    return (
      <Card className={"flex flex-col border-slate-200 dark:border-slate-800 shadow-sm w-full " + className}>
        <CardHeader className="flex items-center gap-2 space-y-0 border-b border-slate-100 dark:border-slate-800 py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={"flex flex-col border-slate-200 dark:border-slate-800 shadow-sm w-full " + className}>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b border-slate-100 dark:border-slate-800 py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1 flex items-stretch">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto min-h-[350px] w-full"
        >
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
            <CartesianGrid vertical={true} horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              dataKey="issueType"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={100}
              tickFormatter={(value) => {
                // Truncate long labels
                if (typeof value === "string" && value.length > 20) {
                  return value.slice(0, 20) + "..."
                }
                return value
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelKey="issueType"
                  indicator="dot"
                />
              }
            />
            {chartKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={"var(--color-" + key + ")"}
                radius={4}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
