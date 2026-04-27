"use client"

import { useState } from "react"
import { BarChart3, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartBarInteractive } from "@/components/ui/chart-bar-interactive"
import { ChartAreaInteractive } from "@/components/ui/chart-area-interactive"
import { useQuery } from "@tanstack/react-query"

export default function SuperadminAnalyticsPage() {
  const [sortOrder] = useState<"asc" | "desc">("desc")
  const [municipalityFilter, setMunicipalityFilter] = useState("all")

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['superadmin-analytics'],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      const json = await apiClient.analytics.superadmin();
      return json;
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Activity className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
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
            description="Visualizing reports received across all active locations." 
            chartData={chartData} 
            chartConfig={{
              reports: {
                label: "Reports",
                color: "#2563eb",
              },
            }} 
          />

          {/* Issue Type Bar Chart with Municipality Filter */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[500px] lg:h-[600px]">
            <CardHeader className="pb-3 flex flex-col gap-3 space-y-0 sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-10 rounded-t-xl">
              <CardTitle className="text-lg">Reports by Issue Type</CardTitle>
              {/* Municipality Filter */}
              <div>
                <select
                  title="Filter by municipality"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  value={municipalityFilter}
                  onChange={(e) => setMunicipalityFilter(e.target.value)}
                >
                  <option value="all">All Municipalities</option>
                  {(analyticsData?.municipalities || []).map((mun: any) => (
                    <option key={mun.id} value={mun.id}>{mun.name}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-4 sm:pt-4 flex-1 flex items-stretch">
              <ChartBarInteractive
                className="w-full h-full"
                chartData={municipalityFilter !== 'all' 
                  ? issueTypeData.filter((d: any) => d.municipalityId === municipalityFilter)
                  : issueTypeData}
                chartConfig={{
                  count: {
                    label: "Reports",
                    color: "#2563eb",
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  )
}








