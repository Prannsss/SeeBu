"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertTriangle, BarChart3, ClipboardList, ArrowRight } from "lucide-react"
import { ChartAreaInteractive } from "@/components/ui/chart-area-interactive"
import Link from "next/link"
import adminData from "./analytics/data.json"

export default function AdminHomePage() {
  return (
    <div className="min-h-screen bg-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Home</h1>
            <p className="text-muted-foreground">Operations overview, urgent cases, and workload signals.</p>
          </div>
          <Badge className="bg-blue-600 text-white">Live Monitoring</Badge>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardDescription className="text-xs sm:text-sm truncate" title="Open Reports">Open Reports</CardDescription>
              <CardTitle className="text-lg sm:text-2xl">134</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0"><ClipboardList className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">+9 today</span></CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardDescription className="text-xs sm:text-sm truncate" title="Critical Cases">Critical Cases</CardDescription>
              <CardTitle className="text-lg sm:text-2xl text-red-600">21</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0"><AlertTriangle className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">Requires immediate response</span></CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardDescription className="text-xs sm:text-sm truncate" title="Resolved Today">Resolved Today</CardDescription>
              <CardTitle className="text-lg sm:text-2xl text-emerald-600">47</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0"><Activity className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">+12% from yesterday</span></CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardDescription className="text-xs sm:text-sm truncate" title="Performance Index">Performance Index</CardDescription>
              <CardTitle className="text-lg sm:text-2xl text-blue-600">92%</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 text-[10px] sm:text-xs text-muted-foreground flex items-center min-w-0"><BarChart3 className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">Weekly trend up</span></CardContent>
          </Card>
        </div>

        <div className="relative">
          <ChartAreaInteractive
            title="Reports Overview"
            description="Last 7 days"
            chartData={adminData.chartData}
            defaultTimeRange="7d"
            hideFilter={true}
            headerAction={
              <Link 
                href="/admin/analytics" 
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-full transition-colors"
              >
                Full Analytics <ArrowRight className="w-4 h-4" />
              </Link>
            }
            chartConfig={{
              views: {
                label: "Reports",
              },
              reports: {
                label: "Reports",
                color: "#2563eb",
              },
            }}
          />
        </div>
      </div>


    </div>
  )
}
