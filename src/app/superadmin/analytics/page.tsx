"use client"

import { useState } from "react"
import { BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartBarInteractive } from "@/components/ui/chart-bar-interactive"
import { ChartAreaInteractive } from "@/components/ui/chart-area-interactive"
import { useQuery } from "@tanstack/react-query"
import { AnalyticsSkeleton } from "@/components/ui/analytics-skeleton"

export default function SuperadminAnalyticsPage() {
  const [sortOrder] = useState<"asc" | "desc">("desc")
  const [municipalityFilter, setMunicipalityFilter] = useState("all")
  const [barangayFilter, setBarangayFilter] = useState("all")

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['superadmin-analytics', municipalityFilter, barangayFilter],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      const json = await apiClient.analytics.superadmin(municipalityFilter, barangayFilter);
      return json;
    }
  })

  if (isLoading) {
    return <AnalyticsSkeleton />
  }

  const recurringData = analyticsData?.recurringData || []
  const chartData = analyticsData?.chartData || [{ date: new Date().toISOString().split('T')[0], reports: 0 }]
  const issueTypeData = analyticsData?.issueTypeData || []

  const sortedData = [...recurringData].sort((a: any, b: any) => {
    return sortOrder === "asc"
      ? a.count - b.count
      : b.count - a.count
  })

  return (
    <div className="min-h-screen bg-white pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-[1600px] mx-auto px-4 py-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Superadmin Analytics</h1>
              <p className="text-muted-foreground">Cross-system analytics for global usage and throughput.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <ChartAreaInteractive
            className="lg:col-span-2 lg:h-[600px]"
            title="Global Reports Overview"
            description="Total vs. resolved reports across all active locations."
            chartData={chartData}
            chartConfig={{
              reports: {
                label: "Total Reports",
                color: "#2563eb",
              },
              resolved: {
                label: "Resolved",
                color: "#10b981",
              },
            }}
          />

          {/* Issue Type Bar Chart — resolution split, per-type colors */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[500px] lg:h-[600px] overflow-y-auto">
            <CardHeader className="pb-3 flex flex-col gap-3 space-y-0 sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-10 rounded-t-xl">
              <div>
                <CardTitle className="text-lg">Reports by Issue Type</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Resolved vs. unresolved per category</p>
              </div>
              {/* Municipality Filter */}
              <div className="flex flex-col gap-2">
                <select
                  title="Filter by municipality"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  value={municipalityFilter}
                  onChange={(e) => {
                    setMunicipalityFilter(e.target.value);
                    setBarangayFilter("all");
                  }}
                >
                  <option value="all">All Municipalities</option>
                  {(analyticsData?.municipalities || []).map((mun: any) => (
                    <option key={mun.id} value={mun.id}>{mun.name}</option>
                  ))}
                </select>
                <select
                  title="Filter by barangay"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm disabled:opacity-50"
                  value={barangayFilter}
                  onChange={(e) => setBarangayFilter(e.target.value)}
                  disabled={municipalityFilter === "all"}
                >
                  <option value="all">All Barangays</option>
                  {(analyticsData?.barangays || [])
                    .filter((b: any) => b.municipality_id === municipalityFilter)
                    .map((brgy: any) => (
                    <option key={brgy.id} value={brgy.id}>{brgy.name}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="px-2 pt-2 sm:px-4 sm:pt-2 flex-1">
              <ChartBarInteractive
                className="w-full border-0 shadow-none"
                chartData={issueTypeData}
                chartConfig={{}}
              />
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  )
}








