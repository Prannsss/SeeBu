"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { BarChart3, CheckCircle2, ClipboardList, FileText, Inbox, MapPinOff } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker, presetRange, type DateRangeValue } from "@/components/ui/date-range-picker"
import { AnalyticsContentSkeleton } from "@/components/ui/analytics-skeleton"
import { useCurrentUser } from "@/hooks/queries/useCurrentUser"
import { formatDayRange } from "@/lib/ph-date"
import { cn } from "@/lib/utils"

// recharts is heavy: load the charts in their own chunk after first paint.
const ChartAreaInteractive = dynamic(() => import("@/components/ui/chart-area-interactive").then((m) => m.ChartAreaInteractive), { ssr: false, loading: () => <Skeleton className="h-[420px] w-full" /> })
const ChartBarInteractive = dynamic(() => import("@/components/ui/chart-bar-interactive").then((m) => m.ChartBarInteractive), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> })

type Analytics = {
  range: { from: string; to: string; granularity: "day" | "month" }
  totals: { total: number; resolved: number; inReview: number; inProgress: number; rejected: number }
  openNow: { total: number; inReview: number; inProgress: number }
  chartData: { date: string; reports: number; resolved: number }[]
  issueTypeData: { issueType: string; resolved: number; unresolved: number }[]
  areaData: { area: string; count: number }[]
  /** Superadmin only: per-barangay counts ("Lahug, Cebu City" unless one municipality is selected). */
  barangayData?: { area: string; count: number }[]
}

/** "Reports by …" card: a ranked list with bars scaled to the top entry. */
function AreaCard({ title, rangeText, rows, columns, limit = 10 }: { title: string; rangeText: string; rows: { area: string; count: number }[]; columns: string; limit?: number }) {
  const top = rows.slice(0, limit)
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>
          Where reports came from · {rangeText}
          {rows.length > limit ? ` · top ${limit} of ${rows.length}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {top.length === 0 ? (
          <p className="text-sm text-slate-600">No reports in this period.</p>
        ) : (
          <ol className={`grid gap-x-8 gap-y-4 ${columns}`}>
            {top.map(({ area, count }) => (
              <li key={area} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-slate-800" title={area}>{area}</span>
                  <span className="tabular-nums text-slate-600">{count.toLocaleString()}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-slate-100" aria-hidden="true">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${(count / top[0].count) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

type Municipality = { id: string; name: string; barangays?: { id: string; name: string }[] }

const AREA_CHART_CONFIG = {
  reports: { label: "Total Reports", color: "#2563eb" },
  resolved: { label: "Resolved", color: "#10b981" },
}

export function AnalyticsDashboard({ role }: { role: "admin" | "superadmin" }) {
  const isAdmin = role === "admin"
  const [range, setRange] = useState<DateRangeValue>(() => presetRange("30d"))
  const [municipalityFilter, setMunicipalityFilter] = useState("all")
  const [barangayFilter, setBarangayFilter] = useState("all")

  const { data: me, isLoading: isMeLoading } = useCurrentUser()
  // Admins are locked to their own municipality; superadmins choose.
  const municipalityId: string = isAdmin ? me?.municipality_id ?? "" : municipalityFilter

  const { data: locations = [] } = useQuery<Municipality[]>({
    queryKey: ["locations"],
    queryFn: async () => {
      const { apiClient } = await import("@/lib/api")
      const json = await apiClient.locations.getAll()
      return json.data || []
    },
    staleTime: 24 * 60 * 60 * 1000,
  })
  const barangays = locations.find((m) => m.id === municipalityId)?.barangays ?? []

  const { data, isFetching, isError, refetch } = useQuery<Analytics>({
    queryKey: [isAdmin ? "admin-analytics" : "superadmin-analytics", municipalityId, barangayFilter, range.from, range.to],
    enabled: !isAdmin || !!municipalityId,
    // Keep the current charts on screen (dimmed) while another range or area loads.
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { apiClient } = await import("@/lib/api")
      return isAdmin
        ? apiClient.analytics.admin(municipalityId, barangayFilter, range)
        : apiClient.analytics.superadmin(municipalityFilter, barangayFilter, range)
    },
  })

  const rangeText = data ? formatDayRange(data.range.from, data.range.to) : ""
  const validReports = data ? data.totals.total - data.totals.rejected : 0
  const resolutionRate = data && validReports > 0 ? Math.round((data.totals.resolved / validReports) * 100) : null

  return (
    <div className="min-h-screen bg-white pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-[1600px] mx-auto px-4 py-8 sm:py-10">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-7 w-7 shrink-0 text-blue-600" aria-hidden="true" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                {isAdmin ? "Admin Analytics" : "Superadmin Analytics"}
              </h1>
              <p className="text-slate-600">
                {isAdmin ? "Report trends and resolution for your municipality." : "Report trends and resolution across every municipality."}
              </p>
            </div>
          </div>

          <div role="group" aria-label="Analytics filters" className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <DateRangePicker value={range} onChange={setRange} className="w-full sm:w-auto" />
            {!isAdmin && (
              <Select
                value={municipalityFilter}
                onValueChange={(value) => {
                  setMunicipalityFilter(value)
                  setBarangayFilter("all")
                }}
              >
                <SelectTrigger aria-label="Municipality" className="h-10 w-full sm:w-[200px] bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All municipalities</SelectItem>
                  {locations.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={barangayFilter} onValueChange={setBarangayFilter} disabled={barangays.length === 0}>
              <SelectTrigger
                aria-label="Barangay"
                title={barangays.length === 0 && !isAdmin ? "Choose a municipality first" : undefined}
                className="h-10 w-full sm:w-[200px] bg-white border-slate-200"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-72">
                <SelectItem value="all">All barangays</SelectItem>
                {barangays.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <p className="sr-only" aria-live="polite">{isFetching && data ? "Updating analytics…" : ""}</p>

        {isAdmin && !isMeLoading && !municipalityId ? (
          <div className="flex flex-col items-center text-center py-12 px-4 rounded-md border border-dashed border-slate-300">
            <MapPinOff className="w-10 h-10 text-slate-500 mb-3" aria-hidden="true" />
            <p className="text-base font-semibold text-slate-900">Your account isn&apos;t linked to a municipality</p>
            <p className="text-sm text-slate-600 mt-1">Ask a superadmin to assign one, then reload this page.</p>
          </div>
        ) : isError && !data ? (
          <div role="alert" className="flex flex-col items-center gap-3 text-center py-12 px-4 rounded-md border border-dashed border-slate-300">
            <p className="text-base font-semibold text-slate-900">We couldn&apos;t load analytics.</p>
            <Button variant="outline" onClick={() => refetch()}>Try again</Button>
          </div>
        ) : !data ? (
          <AnalyticsContentSkeleton />
        ) : (
          <div className={cn("space-y-6 transition-opacity", isFetching && "opacity-60")} aria-busy={isFetching}>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {[
                { label: "Reports", value: data.totals.total, hint: "Submitted in this period", icon: FileText, chip: "bg-sky-100 text-sky-800" },
                {
                  label: "Resolved",
                  value: data.totals.resolved,
                  hint: resolutionRate === null ? "No valid reports yet" : `${resolutionRate}% resolution rate`,
                  icon: CheckCircle2,
                  chip: "bg-emerald-100 text-emerald-600",
                },
                { label: "In review", value: data.totals.inReview, hint: "Awaiting verification", icon: ClipboardList, chip: "bg-amber-100 text-amber-800" },
                { label: "Open now", value: data.openNow.total, hint: `${data.openNow.inProgress.toLocaleString()} with departments`, icon: Inbox, chip: "bg-red-100 text-red-800" },
              ].map(({ label, value, hint, icon: Icon, chip }) => (
                <Card key={label} className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-600 truncate">{label}</p>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${chip}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">{value.toLocaleString()}</p>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600">{hint}</p>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <ChartAreaInteractive
                className="lg:col-span-2"
                title="Reports over time"
                description={`${rangeText} · per ${data.range.granularity}`}
                chartData={data.chartData}
                chartConfig={AREA_CHART_CONFIG}
              />

              <Card className="flex flex-col border-slate-200 dark:border-slate-800 shadow-sm lg:max-h-[560px]">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <CardTitle className="text-lg">Reports by issue type</CardTitle>
                  <CardDescription>Resolved vs. open per category</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto px-2 pt-2 sm:px-4">
                  <ChartBarInteractive className="w-full border-0 shadow-none" chartData={data.issueTypeData} chartConfig={{}} />
                </CardContent>
              </Card>
            </div>

            {isAdmin ? (
              <AreaCard title="Reports by barangay" rangeText={rangeText} rows={data.areaData} columns="sm:grid-cols-2 lg:grid-cols-3" limit={12} />
            ) : (
              // Superadmin: where reports came from at both levels, side by side.
              <div className="grid gap-6 lg:grid-cols-2">
                <AreaCard title="Reports by municipality" rangeText={rangeText} rows={data.areaData} columns="" />
                <AreaCard title="Reports by barangay" rangeText={rangeText} rows={data.barangayData ?? []} columns="" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
