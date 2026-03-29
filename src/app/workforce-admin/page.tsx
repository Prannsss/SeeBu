"use client"

import { Users, ClipboardList, CheckCircle, TrendingUp, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function WorkforceAdminPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-5xl px-5 pt-10 pb-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/50">
            <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Workforce Admin</h1>
            <p className="text-muted-foreground">Department: Sanitation &bull; Assigned Area: Cebu City</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Tasks</CardDescription>
                <CardTitle className="text-3xl text-blue-600">24</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> 10 in progress, 14 pending
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Department Headcount</CardDescription>
                <CardTitle className="text-3xl text-indigo-600">18</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Available field officers
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed Today</CardDescription>
                <CardTitle className="text-3xl text-emerald-600">45</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> <TrendingUp className="w-3 h-3 text-emerald-500"/> 12% vs yesterday
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Task Analytics</CardTitle>
              <CardDescription>Recent completed tasks metrics</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
              <p className="text-muted-foreground">Detailed chart integration goes here...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
