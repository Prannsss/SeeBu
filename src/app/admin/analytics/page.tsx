"use client"

import { BarChart3 } from "lucide-react"
import { ChartLineInteractive } from "@/components/ui/chart-line-interactive"
import { AdminDock } from "@/components/navigation/AdminDock"

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Admin Analytics</h1>
            <p className="text-muted-foreground">Deep dive into report and channel performance trends.</p>
          </div>
        </div>

        <ChartLineInteractive
          title="Admin Analytics Dashboard"
          description="Interactive trend view for desktop and mobile channel activity"
        />
      </div>

      <AdminDock />
    </div>
  )
}
