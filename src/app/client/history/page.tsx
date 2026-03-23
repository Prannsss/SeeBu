"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock3, FileText, CheckCircle2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"

const historyItems = [
  {
    id: "TRK-120034",
    title: "Broken streetlight",
    status: "Resolved",
    date: "Mar 14, 2026",
    timeline: "Issue completely resolved and verified.",
  },
  {
    id: "TRK-120035",
    title: "Leaking water pipe",
    status: "Resolved",
    date: "Mar 12, 2026",
    timeline: "Repairs finished, water supply restored.",
  },
  {
    id: "TRK-120015",
    title: "Drainage overflow",
    status: "In Review",
    date: "Mar 11, 2026",
    timeline: "Assigned to Public Works department.",
  },
  {
    id: "TRK-120016",
    title: "Illegal dumping",
    status: "In Review",
    date: "Mar 09, 2026",
    timeline: "Awaiting site inspection.",
  },
  {
    id: "TRK-119992",
    title: "Road pothole",
    status: "Action Taken",
    date: "Mar 08, 2026",
    timeline: "Maintenance crew dispatched.",
  },
  {
    id: "TRK-119993",
    title: "Traffic light malfunction",
    status: "Action Taken",
    date: "Mar 05, 2026",
    timeline: "Temporary fix applied, replacement parts ordered.",
  },
]

export default function ClientHistoryPage() {
  const [activeTab, setActiveTab] = useState("In Review");

  const filteredItems = historyItems.filter((item) => {
    return item.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <Clock3 className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">History</h1>
            <p className="text-muted-foreground">Review your previous submissions and progress.</p>
          </div>
        </div>

        <Tabs defaultValue="In Review" onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full h-auto mb-6 bg-transparent border-b rounded-none p-0">
            <TabsTrigger 
              value="In Review" 
              className="flex-1 text-sm md:text-base py-3 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out"
            >
              In review
            </TabsTrigger>
            <TabsTrigger 
              value="Action Taken" 
              className="flex-1 text-sm md:text-base py-3 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out"
            >
              Action Taken
            </TabsTrigger>
            <TabsTrigger 
              value="Resolved" 
              className="flex-1 text-sm md:text-base py-3 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out"
            >
              Resolved
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="m-0 focus-visible:outline-none">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 col-span-full text-muted-foreground bg-white/50 rounded-xl border border-dashed border-gray-300">
                  No records found in this category.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <Card key={item.id} className="border-blue-100/70 bg-white/85 backdrop-blur hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:items-center">
                      <div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription className="mt-1">{item.date}</CardDescription>
                      </div>
                      <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50/50 mt-2 sm:mt-0 whitespace-nowrap">{item.id}</Badge>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="leading-snug">{item.timeline}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2 border-t pt-3">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</span>
                        <div className={`flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full ${
                          item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                          item.status === 'Action Taken' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        }`}>
                          {item.status === 'Resolved' && <CheckCircle2 className="h-4 w-4" />}
                          {item.status}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>


    </div>
  )
}
