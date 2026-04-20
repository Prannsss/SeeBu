"use client"

import { useState } from "react"
import { BarChart3, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartAreaInteractive } from "@/components/ui/chart-area-interactive"
import { useQuery } from '@tanstack/react-query'

export default function AdminAnalyticsPage() {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // For demonstration, fetch for cebu-city. In production, pass context admin's municipality_id
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['admin-analytics', 'dynamic'],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      // Get admin's municipality_id from profile
      const profileRes = await apiClient.users.me();
      const municipalityId = profileRes.data?.municipality_id;
      if (!municipalityId) throw new Error('No municipality assigned');
      
      const json = await apiClient.analytics.admin(municipalityId);
      return json;
    }
  });

  const chartData = analyticsData?.chartData || [];
  const recurringData = analyticsData?.recurringData || [];
  const emptyChartData = [{ date: new Date().toISOString().split('T')[0], reports: 0 }];

  const sortedData = [...recurringData].sort((a, b) => {
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
              <h1 className="text-3xl font-bold">Admin Analytics</h1>
              <p className="text-muted-foreground">Deep dive into report trends.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <ChartAreaInteractive
            className="lg:col-span-2 lg:h-[600px]"
            title="Reports Overview"
            description="Visualizing total reports received over time." 
            chartData={chartData.length > 0 ? chartData : emptyChartData}
            chartConfig={{
              reports: {
                label: "Reports",
                color: "#2563eb",
              }
            }} 
          />

          {/* List Section */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[500px] lg:h-[600px]">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-10 rounded-t-xl">
              <div>
                <CardTitle className="text-lg">Recurring Reports</CardTitle>
              </div>
              <button 
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-1.5 px-2 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 text-xs font-semibold"
              >
                {sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {sortOrder === "asc" ? "Lowest" : "Highest"}
              </button>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 px-6 pb-8 pt-4">
              <div className="space-y-4">
                {isLoading ? (
                   <div className="text-center py-10 text-muted-foreground text-sm">Loading reports...</div>
                ) : sortedData.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div>
                      <div className="font-semibold text-sm">{d.issueType || d.issue || 'General'}</div>
                      <div className="text-xs text-muted-foreground">{d.barangay || d.area}</div>
                    </div>
                    <div className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full text-sm">
                      {d.count}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  )
}



