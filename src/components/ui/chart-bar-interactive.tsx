"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"

// Distinct palette for each issue type (resolved color)
const RESOLVED_PALETTE = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#14b8a6", // teal
]

// Lighter contrasting tones for unresolved (same hue, lighter shade)
const UNRESOLVED_PALETTE = [
  "#bfdbfe", // light blue
  "#a7f3d0", // light emerald
  "#fde68a", // light amber
  "#fecaca", // light red
  "#ddd6fe", // light violet
  "#fbcfe8", // light pink
  "#cffafe", // light cyan
  "#d9f99d", // light lime
  "#fed7aa", // light orange
  "#ccfbf1", // light teal
]

// Detect whether the chart data uses the resolution-split format
function isResolutionData(data: any[]): boolean {
  return data.length > 0 && "resolved" in data[0] && "unresolved" in data[0]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

function ResolutionTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const resolved = payload.find((p: any) => p.dataKey === "resolved")?.value ?? 0
  const unresolved = payload.find((p: any) => p.dataKey === "unresolved")?.value ?? 0
  const total = resolved + unresolved
  const idx = payload[0]?.payload?.__colorIndex ?? 0
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 shadow-lg px-4 py-3 text-sm min-w-[180px]">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2 truncate max-w-[200px]">{label}</p>
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: RESOLVED_PALETTE[idx % RESOLVED_PALETTE.length] }} />
        <span className="text-slate-600 dark:text-slate-300">Resolved</span>
        <span className="ml-auto font-bold text-slate-800 dark:text-slate-100">{resolved}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: UNRESOLVED_PALETTE[idx % UNRESOLVED_PALETTE.length], border: `1.5px solid ${RESOLVED_PALETTE[idx % RESOLVED_PALETTE.length]}` }} />
        <span className="text-slate-600 dark:text-slate-300">Unresolved</span>
        <span className="ml-auto font-bold text-slate-800 dark:text-slate-100">{unresolved}</span>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-700 mt-2 pt-1 flex items-center justify-between">
        <span className="text-slate-500 dark:text-slate-400">Total</span>
        <span className="font-bold text-slate-800 dark:text-slate-100">{total}</span>
      </div>
    </div>
  )
}

function ResolutionLegend() {
  return (
    <div className="flex items-center gap-4 justify-center mt-2 text-xs text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />
        <span>Resolved (color per type)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-sm bg-blue-100 border border-blue-400" />
        <span>Unresolved (lighter shade)</span>
      </div>
    </div>
  )
}

export function ChartBarInteractive({
  title,
  description,
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
  if (!chartData || chartData.length === 0) {
    return (
      <Card className={"flex flex-col border-slate-200 dark:border-slate-800 shadow-sm w-full " + className}>
        {title && (
          <CardHeader className="flex items-center gap-2 space-y-0 border-b border-slate-100 dark:border-slate-800 py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </CardHeader>
        )}
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  const useResolution = isResolutionData(chartData)

  // Annotate each item with its color index
  const annotatedData = chartData.map((item, idx) => ({ ...item, __colorIndex: idx }))

  if (useResolution) {
    return (
      <Card className={"flex flex-col border-slate-200 dark:border-slate-800 shadow-sm w-full " + className}>
        {title && (
          <CardHeader className="flex items-center gap-2 space-y-0 border-b border-slate-100 dark:border-slate-800 py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </CardHeader>
        )}
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1 flex flex-col items-stretch">
          <ResponsiveContainer width="100%" height={Math.max(260, annotatedData.length * 52)}>
            <BarChart
              data={annotatedData}
              layout="vertical"
              margin={{ left: 0, right: 20, top: 4, bottom: 4 }}
            >
              <CartesianGrid vertical={true} horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                dataKey="issueType"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={110}
                tickFormatter={(value) => {
                  if (typeof value === "string" && value.length > 18) {
                    return value.slice(0, 18) + "…"
                  }
                  return value
                }}
              />
              <Tooltip content={<ResolutionTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              {/* Resolved bar — left segment of stack, full issue-type color */}
              <Bar dataKey="resolved" stackId="split" radius={[0, 0, 0, 0]}>
                {annotatedData.map((entry, idx) => (
                  <Cell
                    key={"resolved-" + idx}
                    fill={RESOLVED_PALETTE[idx % RESOLVED_PALETTE.length]}
                  />
                ))}
              </Bar>
              {/* Unresolved bar — right segment of stack, contrasting lighter color */}
              <Bar dataKey="unresolved" stackId="split" radius={[0, 4, 4, 0]}>
                {annotatedData.map((entry, idx) => (
                  <Cell
                    key={"unresolved-" + idx}
                    fill={UNRESOLVED_PALETTE[idx % UNRESOLVED_PALETTE.length]}
                    stroke={RESOLVED_PALETTE[idx % RESOLVED_PALETTE.length]}
                    strokeWidth={1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <ResolutionLegend />
        </CardContent>
      </Card>
    )
  }

  // ── Legacy mode (single count key) ──────────────────────────────────────────
  const chartKeys = Object.keys(chartConfig || {}).filter(k => k !== "views" && k !== "label")

  return (
    <Card className={"flex flex-col border-slate-200 dark:border-slate-800 shadow-sm w-full " + className}>
      {title && (
        <CardHeader className="flex items-center gap-2 space-y-0 border-b border-slate-100 dark:border-slate-800 py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </CardHeader>
      )}
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1 flex items-stretch">
        <ChartContainer config={chartConfig} className="aspect-auto min-h-[350px] w-full">
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
                if (typeof value === "string" && value.length > 20) {
                  return value.slice(0, 20) + "..."
                }
                return value
              }}
            />
            {chartKeys.map((key) => (
              <Bar key={key} dataKey={key} fill={"var(--color-" + key + ")"} radius={4} />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
