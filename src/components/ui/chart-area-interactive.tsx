
"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ChartAreaInteractive({
  title = "Area Chart",
  description = "Showing data over time",
  chartData = [],
  chartConfig = {},
  defaultTimeRange = "this_month",
  headerAction,
  hideFilter = false,
  className = "",
}: any) {
  const [timeRange, setTimeRange] = React.useState(defaultTimeRange)

  const chartKeys = Object.keys(chartConfig || {}).filter(k => k !== "views" && k !== "label")

  const processedData = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return []

    const sorted = [...chartData].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const latestDate = new Date(sorted[sorted.length - 1].date)
    let startDate = new Date(sorted[0].date)

    if (timeRange !== "all") {
      if (timeRange === "this_month") {
        startDate = new Date(latestDate)
        startDate.setUTCDate(1)
      } else {
        let daysToSubtract = 29
        if (timeRange === "7d") daysToSubtract = 6
        
        startDate = new Date(latestDate)
        startDate.setUTCDate(startDate.getUTCDate() - daysToSubtract)
      }
    }

    const dataMap: Record<string, any> = {}
    sorted.forEach((item: any) => {
      dataMap[item.date] = item
    })

    const result = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= latestDate) {
      const dateStr = currentDate.toISOString().split("T")[0]
      if (dataMap[dateStr]) {
        result.push(dataMap[dateStr])
      } else {
        const emptyItem: any = { date: dateStr }
        chartKeys.forEach(k => {
          emptyItem[k] = 0
        })
        result.push(emptyItem)
      }
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }

    return result
  }, [chartData, timeRange, chartConfig])

  return (
    <Card className={"flex flex-col border-slate-200 dark:border-slate-800 shadow-sm w-full " + className}>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b border-slate-100 dark:border-slate-800 py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          {headerAction && (
            <div className="shrink-0">{headerAction}</div>
          )}
          {!hideFilter && (
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="w-[160px] rounded-lg bg-white dark:bg-slate-900 border-slate-200 shadow-sm"
                aria-label="Select a value"
              >
                <SelectValue placeholder="This Month" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white dark:bg-slate-900 z-50">
                <SelectItem value="this_month" className="rounded-lg">
                  This Month
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  Last 30 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  Last 7 days
                </SelectItem>
                <SelectItem value="all" className="rounded-lg">
                  All Time
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1 flex items-stretch">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto min-h-[350px] w-full"
        >
          <AreaChart data={processedData}>
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
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            {chartKeys.map((key) => (
                <Area key={key} dataKey={key} type="monotone" fill={"url(#fill" + key + ")"} stroke={"var(--color-" + key + ")"} stackId="a" />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
