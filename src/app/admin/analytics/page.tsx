"use client"

import { useState } from "react"
import { BarChart3, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartBarInteractive } from "@/components/ui/chart-bar-interactive"
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
  const issueTypeData = analyticsData?.issueTypeData || [];
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

          {/* Issue Type Bar Chart - replaces Recurring Reports list */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[500px] lg:h-[600px]">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-10 rounded-t-xl">
              <div>
                <CardTitle className="text-lg">Reports by Issue Type</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-4 sm:pt-4 flex-1 flex items-stretch">
              <ChartBarInteractive
                className="w-full h-full"
                chartData={issueTypeData}
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



