"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertTriangle, BarChart3, ClipboardList } from "lucide-react"
import { ChartLineInteractive } from "@/components/ui/chart-line-interactive"
import { AdminDock } from "@/components/navigation/AdminDock"

export default function AdminHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-32 dark:from-slate-950 dark:to-slate-900">
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

        <ChartLineInteractive
          title="Admin Traffic and Resolution Load"
          description="Desktop and mobile operational activity over the last 3 months"
        />
      </div>

      <AdminDock />
    </div>
  )
}
