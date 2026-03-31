"use client"

import { useState } from "react"
import { ClipboardList, Users, CheckCircle2, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { gooeyToast } from "goey-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Task = {
  id: string
  title: string
  description: string
  status: "Pending" | "Accepted" | "Completed"
  date: string
  officer?: string
}

const initialTasks: Task[] = [
  { id: "TSK-001", title: "Fix Drainage at Mandaue", description: "Clear out the blocked main drainage pipeline on AS Fortuna.", status: "Pending", date: "Mar 31, 2026" },
  { id: "TSK-002", title: "Pothole Repair Banilad", description: "Patch the large pothole causing traffic buildup.", status: "Pending", date: "Mar 30, 2026" },
  { id: "TSK-003", title: "Replacing Streetlights", description: "Change broken bulbs at the south intersection.", status: "Completed", date: "Mar 28, 2026", officer: "John Doe" },
]

export default function WorkforceAdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTab, setActiveTab] = useState("Pending")
  const [delegateTo, setDelegateTo] = useState("")

  const pendingTasks = tasks.filter(t => t.status !== "Completed")
  const completedTasks = tasks.filter(t => t.status === "Completed")

  const handleAccept = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: "Accepted" } : t))
    gooeyToast.success("Task accepted! You can now delegate it.")
  }

  const handleDelegate = (taskId: string) => {
    if (!delegateTo) {
      gooeyToast.error("Please select an officer first.")
      return
    }
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: "Pending", officer: delegateTo } : t))
    gooeyToast.success(`Task delegated to ${delegateTo}!`)
    setDelegateTo("")
  }

  const handleComplete = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: "Completed" } : t))
    gooeyToast.success("Task marked as completed!")
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/50">
            <ClipboardList className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Manage Tasks</h1>
            <p className="text-muted-foreground">Accept approved admin reports and delegate to officers.</p>
          </div>
        </div>

        <Tabs defaultValue="Pending" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-transparent border-b rounded-none p-0">
            <TabsTrigger
              value="Pending"
              className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              Pending Tasks
            </TabsTrigger>
            <TabsTrigger
              value="Completed"
              className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              Completed Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="Pending" className="space-y-4 outline-none">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No pending tasks available.</div>
            ) : (
              pendingTasks.map(task => (
                <Card key={task.id} className="border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <CardDescription>{task.date}</CardDescription>
                      </div>
                      <Badge variant={task.status === "Accepted" ? "secondary" : "default"}>
                        {task.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {task.description}
                    </p>
                    {task.officer && (
                      <p className="text-sm font-medium mb-3">Delegated to: {task.officer}</p>
                    )}
                    
                    <div className="flex gap-2">
                      {task.status === "Pending" && !task.officer && (
                        <Button onClick={() => handleAccept(task.id)} className="w-full">
                          Accept
                        </Button>
                      )}
                      
                      {(task.status === "Accepted" || (task.status === "Pending" && task.officer)) && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                              Delegate
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md rounded-lg w-[calc(100%-2rem)]">
                            <DialogHeader>
                              <DialogTitle>Delegate Task</DialogTitle>
                              <DialogDescription>Assign this task to an officer.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Select value={delegateTo} onValueChange={setDelegateTo}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Officer" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Officer Juan">Officer Juan</SelectItem>
                                  <SelectItem value="Officer Maria">Officer Maria</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={() => handleDelegate(task.id)} className="w-full">
                              Confirm Delegation
                            </Button>
                          </DialogContent>
                        </Dialog>
                      )}

                      {task.officer && (
                        <Button 
                          onClick={() => handleComplete(task.id)} 
                          variant="secondary" 
                          className="w-full bg-green-100 hover:bg-green-200 text-green-800"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="Completed" className="space-y-4 outline-none">
            {completedTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No completed tasks yet.</div>
            ) : (
              completedTasks.map(task => (
                <Card key={task.id} className="border-slate-200 dark:border-slate-800 opacity-80">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg line-through text-slate-500">{task.title}</CardTitle>
                        <CardDescription>{task.date}</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500 mb-2">
                      {task.description}
                    </p>
                    {task.officer && (
                      <p className="text-sm text-slate-500">Completed by: {task.officer}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
