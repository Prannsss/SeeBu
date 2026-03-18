"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, ShieldCheck, ServerCog, TrendingUp, ArrowRight } from "lucide-react"
import { ChartAreaInteractive } from "@/components/ui/chart-area-interactive"
import { SuperadminDock } from "@/components/navigation/SuperadminDock"
import Link from "next/link"
import superadminData from "../analytics/data.json"

export default function SuperadminHomePage() {
  return (
    <div className="min-h-screen bg-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Superadmin Home</h1>
            <p className="text-muted-foreground">System-wide visibility, governance, and platform health analytics.</p>
          </div>
          <Badge className="bg-blue-600 text-white">Global Scope</Badge>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Platform Health</CardDescription>
              <CardTitle className="text-2xl text-emerald-600">99.94%</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground"><ShieldCheck className="mr-1 inline h-4 w-4" /> Stable over 30 days</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Services</CardDescription>
              <CardTitle className="text-2xl">42</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground"><ServerCog className="mr-1 inline h-4 w-4" /> 2 in scheduled maintenance</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Daily Requests</CardDescription>
              <CardTitle className="text-2xl text-blue-600">18,402</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground"><Activity className="mr-1 inline h-4 w-4" /> +8.2% week over week</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Growth Trend</CardDescription>
              <CardTitle className="text-2xl text-indigo-600">+14.7%</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground"><TrendingUp className="mr-1 inline h-4 w-4" /> Sustained monthly uplift</CardContent>
          </Card>
        </div>

        <div className="relative">
          <ChartAreaInteractive
            title="Reports Overview"
            description="Last 7 days"
            chartData={superadminData.chartData}
            defaultTimeRange="7d"
            hideFilter={true}
            headerAction={
              <Link 
                href="/superadmin/analytics" 
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-full transition-colors"
              >
                Full Analytics <ArrowRight className="w-4 h-4" />
              </Link>
            }
            chartConfig={{
              views: {
                label: "Reports"
              },
              cebu_city: {
                label: "Cebu City",
                color: "#2563eb"
              },
              mandaue: {
                label: "Mandaue",
                color: "#10b981"
              },
              lapu_lapu: {
                label: "Lapu-Lapu",
                color: "#f59e0b"
              }
            }}
          />
        </div>
      </div>

      <SuperadminDock />
    </div>
  )
}
