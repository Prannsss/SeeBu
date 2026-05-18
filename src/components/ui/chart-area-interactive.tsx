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

const TIME_TABS = [
  { key: "7d",         label: "7 Days" },
  { key: "this_month", label: "This Month" },
  { key: "this_year",  label: "This Year" },
] as const

export function ChartAreaInteractive({
  title = "Area Chart",
  description = "Showing data over time",
  chartData = [],
  chartConfig = {},
  defaultTimeRange = "7d",
  headerAction,
  hideFilter = false,
  className = "",
}: any) {
  const [timeRange, setTimeRange] = React.useState(defaultTimeRange)

  const chartKeys = Object.keys(chartConfig || {}).filter(k => k !== "views" && k !== "label")

  const processedData = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return []

    const now = new Date()
    const todayStr = now.toISOString().split("T")[0]
    let startDate: Date

    if (timeRange === "7d") {
      // Last 7 days including today
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 6)
      startDate = new Date(startDate.toISOString().split("T")[0])
    } else if (timeRange === "this_month") {
      startDate = new Date(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`)
    } else {
      // this_year
      startDate = new Date(`${now.getFullYear()}-01-01`)
    }

    const endDate = new Date(todayStr)

    const dataMap: Record<string, any> = {}
    chartData.forEach((item: any) => {
      dataMap[item.date] = item
    })

    const result = []
    const cur = new Date(startDate)
    while (cur <= endDate) {
      const dateStr = cur.toISOString().split("T")[0]
      if (dataMap[dateStr]) {
        result.push(dataMap[dateStr])
      } else {
        const empty: any = { date: dateStr }
        chartKeys.forEach(k => { empty[k] = 0 })
        result.push(empty)
      }
      cur.setDate(cur.getDate() + 1)
    }

    return result
  }, [chartData, timeRange, chartKeys])

  return (
    <Card className={"flex flex-col border-slate-200 dark:border-slate-800 shadow-sm w-full " + className}>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b border-slate-100 dark:border-slate-800 py-5 sm:flex-row flex-wrap">
        <div className="grid flex-1 gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
          {headerAction && (
            <div className="shrink-0">{headerAction}</div>
          )}
          {!hideFilter && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-0.5">
              {TIME_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setTimeRange(tab.key)}
                  className={
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 " +
                    (timeRange === tab.key
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
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
                if (timeRange === "today") {
                  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
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
            {/* Render total/base keys first (underneath), then resolved on top */}
            {chartKeys
              .slice()
              .sort((a) => (a === "resolved" ? 1 : -1))
              .map((key) => (
                <Area
                  key={key}
                  dataKey={key}
                  type="monotone"
                  fill={"url(#fill" + key + ")"}
                  stroke={"var(--color-" + key + ")"}
                  strokeWidth={2}
                  // No stackId → true overlap
                />
              ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
