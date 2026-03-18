"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertTriangle, BarChart3, ClipboardList, ArrowRight } from "lucide-react"
import { ChartAreaInteractive } from "@/components/ui/chart-area-interactive"
import { AdminDock } from "@/components/navigation/AdminDock"
import Link from "next/link"
import adminData from "../analytics/data.json"

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

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Open Reports</CardDescription>
              <CardTitle className="text-2xl">134</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground"><ClipboardList className="mr-1 inline h-4 w-4" /> +9 today</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Critical Cases</CardDescription>
              <CardTitle className="text-2xl text-red-600">21</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground"><AlertTriangle className="mr-1 inline h-4 w-4" /> Requires immediate response</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Resolved Today</CardDescription>
              <CardTitle className="text-2xl text-emerald-600">47</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground"><Activity className="mr-1 inline h-4 w-4" /> +12% from yesterday</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Performance Index</CardDescription>
              <CardTitle className="text-2xl text-blue-600">92%</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground"><BarChart3 className="mr-1 inline h-4 w-4" /> Weekly trend up</CardContent>
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

      <AdminDock />
    </div>
  )
}
