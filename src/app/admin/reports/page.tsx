"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileWarning, MapPin, ShieldCheck } from "lucide-react"
import { AdminDock } from "@/components/navigation/AdminDock"

const reports = [
  { id: "RPT-1091", title: "Flooded street section", zone: "Mabolo", level: "High" },
  { id: "RPT-1084", title: "Damaged drainage cover", zone: "Talamban", level: "Medium" },
  { id: "RPT-1077", title: "Traffic light outage", zone: "Lahug", level: "High" },
]

export default function AdminReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <FileWarning className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Prioritize reports by severity and location impact.</p>
          </div>
        </div>

        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="border-blue-100/70 bg-white/85 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <Badge variant="outline" className="border-blue-300 text-blue-700">{report.id}</Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {report.zone}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="h-4 w-4" /> Severity: {report.level}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AdminDock />
    </div>
  )
}
