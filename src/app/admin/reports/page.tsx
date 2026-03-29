"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileWarning, MapPin, AlertCircle, CheckCircle2, FileText, Filter } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const reports = [
  { id: "RPT-1091", title: "Flooded street section", zone: "Mabolo", urgency: "High", status: "In Review", date: "Mar 14, 2026", timeline: "Awaiting site inspection." },
  { id: "RPT-1084", title: "Damaged drainage cover", zone: "Talamban", urgency: "Medium", status: "Action Taken", date: "Mar 12, 2026", timeline: "Maintenance crew dispatched." },
  { id: "RPT-1077", title: "Traffic light outage", zone: "Lahug", urgency: "High", status: "Resolved", date: "Mar 11, 2026", timeline: "Issue completely resolved and verified." },
  { id: "RPT-1078", title: "Illegal dumping", zone: "Guadalupe", urgency: "Low", status: "In Review", date: "Mar 09, 2026", timeline: "Assigned to Public Works department." },
  { id: "RPT-1079", title: "Road pothole", zone: "Capitol Site", urgency: "Medium", status: "Action Taken", date: "Mar 08, 2026", timeline: "Road blocked off, repair starting tomorrow." },
]

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState("In Review");
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  const [delegationOpen, setDelegationOpen] = useState<string | null>(null);
  const [delegateToWorkforce, setDelegateToWorkforce] = useState("");

  const filteredItems = reports.filter((item) => {
    const matchesTab = item.status === activeTab;
    const matchesUrgency = urgencyFilter === "All" || item.urgency === urgencyFilter;
    return matchesTab && matchesUrgency;
  });

  return (
    <div className="min-h-screen bg-white pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileWarning className="h-7 w-7 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Reports</h1>
              <p className="text-muted-foreground">Prioritize reports by urgency and location impact.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 z-10 relative">
            <Filter className="h-5 w-5 text-slate-500" />
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[140px] bg-white dark:bg-slate-900 border-slate-200 shadow-sm">
                <SelectValue placeholder="Filter Urgency" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 z-50">
                <SelectItem value="All">All Urgency</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="In Review" onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full h-auto mb-6 bg-transparent border-b rounded-none p-0 overflow-x-auto no-scrollbar">
            <TabsTrigger
              value="In Review"
              className="flex-1 text-sm md:text-base py-3 px-4 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out whitespace-nowrap"
            >
              In Review
            </TabsTrigger>
            <TabsTrigger
              value="Action Taken"
              className="flex-1 text-sm md:text-base py-3 px-4 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out whitespace-nowrap"
            >
              Action Taken
            </TabsTrigger>
            <TabsTrigger
              value="Resolved"
              className="flex-1 text-sm md:text-base py-3 px-4 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out whitespace-nowrap"
            >
              Resolved
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0 focus-visible:outline-none">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 col-span-full text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                  No records found for this category and urgency.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <Dialog key={item.id} open={delegationOpen === item.id} onOpenChange={(open) => setDelegationOpen(open ? item.id : null)}>
                    <Card className="border-blue-100/70 bg-white/85 backdrop-blur hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2 flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:items-center">
                        <div>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" /> {item.zone} • {item.date}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50/50 mt-2 sm:mt-0 whitespace-nowrap">{item.id}</Badge>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                          <span className="leading-snug">{item.timeline}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 border-t pt-3">
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status • Urgency</span>
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              item.urgency === 'High' ? 'bg-red-100 text-red-700' :
                              item.urgency === 'Medium' ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              <AlertCircle className="h-3 w-3" />
                              {item.urgency}
                            </div>
                            <div className={`flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full ${
                              item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              item.status === 'Action Taken' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            }`}>
                              {item.status === 'Resolved' && <CheckCircle2 className="h-4 w-4" />}
                              {item.status}
                            </div>
                          </div>
                        </div>

                        {item.status !== 'Resolved' && (
                          <DialogTrigger asChild className="mt-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                            <Button variant="outline" size="sm" className="w-full font-medium">Delegate Task</Button>
                          </DialogTrigger>
                        )}
                        
                      </CardContent>
                    </Card>

                    <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md rounded-lg">
                      <DialogHeader>
                        <DialogTitle>Delegate Task</DialogTitle>
                        <DialogDescription>
                          Assign this task to a workforce member or department.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="grid gap-4 py-4">
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border p-3">
                          <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{item.title}</div>
                          <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.zone}</span>
                            <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {item.urgency}</span>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <label htmlFor="workforce-select" className="text-sm font-medium">Select Workforce Admin / Officer</label>
                          <Select value={delegateToWorkforce} onValueChange={setDelegateToWorkforce}>
                            <SelectTrigger id="workforce-select" className="bg-white dark:bg-slate-900 border-slate-200">
                              <SelectValue placeholder="Choose personnel..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 z-[100]">
                              <SelectItem value="dept-sanitation">Department: Sanitation</SelectItem>
                              <SelectItem value="dept-streets">Department: Street Maintenance</SelectItem>
                              <SelectItem value="dept-public-works">Department: Public Works</SelectItem>
                              <SelectItem value="officer-001">John Reyes (Sanitation)</SelectItem>
                              <SelectItem value="officer-002">Maria Garcia (Street Repair)</SelectItem>
                              <SelectItem value="officer-003">Carlos Santos (Infrastructure)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                        <Button variant="outline" onClick={() => setDelegationOpen(null)}>Cancel</Button>
                        <Button 
                          onClick={() => { console.log(`Delegated ${item.id} to:`, delegateToWorkforce); setDelegationOpen(null); }}
                          disabled={!delegateToWorkforce}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Confirm Delegation
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>


    </div>
  )
}
