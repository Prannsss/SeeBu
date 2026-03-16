"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock3, FileText, CheckCircle2 } from "lucide-react"
import { ClientDock } from "@/components/navigation/ClientDock"

const historyItems = [
  {
    id: "TRK-120034",
    title: "Broken streetlight",
    status: "Resolved",
    date: "Mar 14, 2026",
  },
  {
    id: "TRK-120015",
    title: "Drainage overflow",
    status: "In Review",
    date: "Mar 11, 2026",
  },
  {
    id: "TRK-119992",
    title: "Road pothole",
    status: "Action Taken",
    date: "Mar 08, 2026",
  },
]

export default function ClientHistoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <Clock3 className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">History</h1>
            <p className="text-muted-foreground">Review your previous submissions and progress.</p>
          </div>
        </div>

        <div className="grid gap-4">
          {historyItems.map((item) => (
            <Card key={item.id} className="border-blue-100/70 bg-white/85 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <Badge variant="outline" className="border-blue-300 text-blue-700">{item.id}</Badge>
                </div>
                <CardDescription>{item.date}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Concern timeline updated
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {item.status}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ClientDock />
    </div>
  )
}
