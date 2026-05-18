"use client"

import { useState } from "react"
import { BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartBarInteractive } from "@/components/ui/chart-bar-interactive"
import { ChartAreaInteractive } from "@/components/ui/chart-area-interactive"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery } from '@tanstack/react-query'

export default function AdminAnalyticsPage() {
  const [barangayFilter, setBarangayFilter] = useState("all")

  // For demonstration, fetch for cebu-city. In production, pass context admin's municipality_id
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['admin-analytics', barangayFilter],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      // Get admin's municipality_id from profile
      const profileRes = await apiClient.users.me();
      const municipalityId = profileRes.data?.municipality_id;
      if (!municipalityId) throw new Error('No municipality assigned');
      
      const json = await apiClient.analytics.admin(municipalityId, barangayFilter);
      return json;
    }
  });

  const chartData = analyticsData?.chartData || [];
  const issueTypeData = analyticsData?.issueTypeData || [];
  const emptyChartData = [{ date: new Date().toISOString().split('T')[0], reports: 0, resolved: 0 }];

  return (
    <div className="min-h-screen bg-white pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-[1600px] mx-auto px-4 py-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Admin Analytics</h1>
              <p className="text-muted-foreground">Deep dive into report trends.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={barangayFilter} onValueChange={setBarangayFilter}>
              <SelectTrigger className="w-[180px] bg-white border-slate-200">
                <SelectValue placeholder="All Barangays" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Barangays</SelectItem>
                {analyticsData?.barangays?.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <ChartAreaInteractive
            className="lg:col-span-2 lg:h-[600px]"
            title="Reports Overview"
            description="Total vs. resolved reports over time."
            chartData={chartData.length > 0 ? chartData : emptyChartData}
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
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-10 rounded-t-xl">
              <div>
                <CardTitle className="text-lg">Reports by Issue Type</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Resolved vs. unresolved per category</p>
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



