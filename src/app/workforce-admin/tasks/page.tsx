"use client"

import { useState } from "react"
import { ClipboardList, Users, CheckCircle2, Clock, Link2 } from "lucide-react" 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { gooeyToast } from "goey-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ReportMediaGallery } from "@/components/reports/report-media-gallery"

type LinkedReport = {
  id: string;
  title?: string;
  description?: string;
  urgency?: string;
  municipality?: string;
  barangay?: string;
  streetAddress?: string;
  landmark?: string;
  reporterPhotos: string[];
  completionPhotos: string[];
};

export default function WorkforceAdminTasksPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("Pending")
  const [delegateTo, setDelegateTo] = useState("")
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<LinkedReport | null>(null)

  const { data: profileData } = useQuery({
    queryKey: ['workforce-admin-profile'],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      const res = await apiClient.users.me();
      return res.data;
    }
  })

  const departmentId = profileData?.department_id ? String(profileData.department_id) : "";

  const { data: officersData } = useQuery({
    queryKey: ['workforce-admin-officers', departmentId],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      const res = await apiClient.departments.getPersonnel(departmentId);
      return res.data || [];
    },
    enabled: !!departmentId,
  })

  const officers = (Array.isArray(officersData) ? officersData : [])
    .filter((person: any) => person.role === 'workforce' && String(person.status || '').toLowerCase() === 'active')
    .map((person: any) => ({
      id: person.id,
      name: person.officer_role ? `${person.full_name} (${person.officer_role})` : person.full_name,
    }));

  const officerNameById = new Map(officers.map((o: any) => [o.id, o.name]));

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['workforce-admin-tasks'],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      const deptId = departmentId;
      if (!deptId) throw new Error('No department assigned');
      
      const json = await apiClient.tasks.getAll({ delegated_to: deptId });
      return json.data;
    },
    enabled: !!departmentId,
  })

  const updateTaskMutation = useMutation({
    mutationFn: async (payload: { id: string, status?: string, assigned_to?: string }) => {
      const { apiClient } = await import('@/lib/api');
      const res = await apiClient.tasks.update(payload.id, { 
        status: payload.status, 
        assigned_to: payload.assigned_to 
      });
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workforce-admin-tasks'] })
  })

  const tasksList = Array.isArray(tasksData) ? tasksData.map(t => ({
    id: t.id,
    title: t.title,
    description: t.location, // Mapping location to description field used in UI
    status: t.status,
    date: new Date(t.created_at).toLocaleDateString(),
    assignedToId: t.assigned_to || null,
    officer: t.assigned_to ? officerNameById.get(t.assigned_to) || "Assigned officer" : undefined,
    related_report_id: t.related_report_id,
    related_report: t.related_report ? {
      id: t.related_report.id,
      title: t.related_report.title,
      description: t.related_report.description,
      urgency: t.related_report.urgency,
      municipality: t.related_report.municipalities?.name || "Unknown",
      barangay: t.related_report.barangays?.name || "Unknown",
      streetAddress: t.related_report.location || "N/A",
      landmark: t.related_report.landmark || "N/A",
      reporterPhotos: (t.related_report.report_photos || []).filter((p: any) => !p.is_completion_photo).map((p: any) => p.photo_url),
      completionPhotos: (t.related_report.report_photos || []).filter((p: any) => p.is_completion_photo).map((p: any) => p.photo_url),
    } : null,
    created_by: t.created_by || "System"
  })) : []

  const pendingTasks = tasksList.filter(t => t.status === "Pending" || t.status === "Accepted")
  const assignedTasks = tasksList.filter(t => t.status === "Assigned")
  const completedTasks = tasksList.filter(t => t.status === "Completed")

  const handleAccept = (taskId: string) => {
    updateTaskMutation.mutate({ id: taskId, status: 'Accepted' }, {
      onSuccess: () => gooeyToast.success("Task accepted! You can now delegate it.")
    })
  }

  const handleDelegate = (taskId: string) => {
    if (!delegateTo) {
      gooeyToast.error("Please select an officer first.")
      return
    }
    updateTaskMutation.mutate({ id: taskId, assigned_to: delegateTo, status: 'Assigned' }, {
      onSuccess: () => {
        gooeyToast.success("Task dispatched and assigned to officer successfully.")
        setDialogOpen(null)
        setDelegateTo("")
      }
    })
  }

  const handleViewLinkedReport = (task: any) => {
    if (!task.related_report) {
      gooeyToast.error("No linked report details available for this task yet.")
      return
    }
    setSelectedReport(task.related_report)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-orange-100 text-orange-700 border-orange-200"
      case "Accepted": return "bg-blue-100 text-blue-700 border-blue-200"
      case "Completed": return "bg-emerald-100 text-emerald-700 border-emerald-200"
      default: return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Department Tasks</h1>
            <p className="text-muted-foreground mt-1">Review department assignments and delegate to your workforce members.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex h-auto w-full bg-white dark:bg-slate-900 border rounded-lg p-1">
            <TabsTrigger value="Pending" className="flex-1 rounded-md py-2.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400">Pending Actions</TabsTrigger>
            <TabsTrigger value="Assigned" className="flex-1 rounded-md py-2.5 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900/30 dark:data-[state=active]:text-amber-400">Assigned Actions</TabsTrigger>
            <TabsTrigger value="Completed" className="flex-1 rounded-md py-2.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-400">Completed Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="Pending">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed">No pending tasks for your department.</div>
            ) : (
              <div className="grid gap-4">
                {pendingTasks.map((task) => (
                  <Card key={task.id} className="overflow-hidden hover:shadow-md transition-shadow dark:bg-slate-900">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="font-mono text-xs">{task.id}</Badge>
                          <Badge variant="secondary" className={getStatusColor(task.status)}>{task.status}</Badge>
                        </div>
                        <h3 className="text-xl font-semibold">{task.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">{task.description}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 border-t pt-4 text-sm">
                          <div className="flex items-center text-slate-500"><Clock className="w-4 h-4 mr-2" /> Logged: {task.date}</div>
                          {task.related_report_id && (
                            <div className="flex items-center text-slate-500"><Link2 className="w-4 h-4 mr-2" /> Report: <span className="font-medium text-blue-600 ml-1">{task.related_report_id}</span></div>
                          )}
                          <div className="flex items-center text-slate-500"><Users className="w-4 h-4 mr-2" /> Assignee: <span className="font-medium text-slate-900 dark:text-slate-200 ml-1">{task.officer || "Unassigned"}</span></div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 p-6 border-t md:border-t-0 md:border-l flex flex-col justify-center gap-3 min-w-[240px]">
                        {task.status === "Pending" ? (
                          <Button onClick={() => handleAccept(task.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Accept Department Task</Button>
                        ) : !task.assignedToId ? (
                          <Dialog open={dialogOpen === task.id} onOpenChange={(open) => setDialogOpen(open ? task.id : null)}>
                            <DialogTrigger asChild>
                              <Button
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                                onClick={() => setDelegateTo("")}
                              >
                                Assign to Officer
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                              <DialogHeader>
                                <DialogTitle>Delegate Task to Officer</DialogTitle>
                                <DialogDescription>Assign the field operation for {task.id} to an available workforce member.</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <Select value={delegateTo} onValueChange={setDelegateTo}>
                                  <SelectTrigger><SelectValue placeholder="Select workforce officer..." /></SelectTrigger>
                                  <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 z-[300]">
                                    {officers.map(o => (
                                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {officers.length === 0 ? (
                                  <p className="text-xs text-slate-500">No active officers available in your department.</p>
                                ) : null}
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => handleDelegate(task.id)}
                                  disabled={!delegateTo || officers.length === 0}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  Confirm Assignment
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ) : null}
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleViewLinkedReport(task)}
                        >
                          View Linked Report
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="Assigned">
            {assignedTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed">No assigned tasks yet.</div>
            ) : (
              <div className="grid gap-4">
                {assignedTasks.map((task) => (
                  <Card key={task.id} className="overflow-hidden hover:shadow-md transition-shadow dark:bg-slate-900">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="font-mono text-xs">{task.id}</Badge>
                          <Badge variant="secondary" className={getStatusColor(task.status)}>{task.status}</Badge>
                        </div>
                        <h3 className="text-xl font-semibold">{task.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">{task.description}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 border-t pt-4 text-sm">
                          <div className="flex items-center text-slate-500"><Clock className="w-4 h-4 mr-2" /> Logged: {task.date}</div>
                          {task.related_report_id && (
                            <div className="flex items-center text-slate-500"><Link2 className="w-4 h-4 mr-2" /> Report: <span className="font-medium text-blue-600 ml-1">{task.related_report_id}</span></div>
                          )}
                          <div className="flex items-center text-slate-500"><Users className="w-4 h-4 mr-2" /> Assignee: <span className="font-medium text-slate-900 dark:text-slate-200 ml-1">{task.officer || "Unassigned"}</span></div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 p-6 border-t md:border-t-0 md:border-l flex flex-col justify-center gap-3 min-w-[240px]">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleViewLinkedReport(task)}
                        >
                          View Linked Report
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="Completed">
            {completedTasks.length === 0 ? (
               <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed">No completed tasks yet.</div>
            ) : (
               <div className="grid gap-4">
                 {completedTasks.map((task) => (
                   <Card key={task.id} className="dark:bg-slate-900 border-emerald-100 dark:border-emerald-900">
                     <CardHeader className="pb-3 border-b border-emerald-50 dark:border-emerald-950 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                       <div>
                         <CardTitle className="text-lg flex items-center gap-2">
                           <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                           {task.title}
                         </CardTitle>
                         <div className="flex gap-2 text-xs text-muted-foreground mt-2 font-mono">{task.id}</div>
                       </div>
                       <Badge className="bg-emerald-100 text-emerald-700 border-none mt-2 sm:mt-0">Completed</Badge>
                     </CardHeader>
                     <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                       <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> <span className="text-slate-600 dark:text-slate-400">Date:</span> {task.date}</div>
                       <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /> <span className="text-slate-600 dark:text-slate-400">Completed By:</span> {task.officer}</div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={Boolean(selectedReport)} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-5xl rounded-xl max-h-[88vh] overflow-y-auto p-5 sm:p-7">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title || "Linked Report"}</DialogTitle>
            <DialogDescription>
              Report ID: {selectedReport?.id || "N/A"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900 h-fit">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Report Details</h4>
                <div className="text-sm text-muted-foreground grid gap-2">
                  <div className="flex justify-between border-b pb-2 gap-4">
                    <span className="text-slate-500">Urgency Level:</span>
                    <span className={`font-medium text-right ${
                      selectedReport?.urgency === "High"
                        ? "text-red-600 dark:text-red-400"
                        : selectedReport?.urgency === "Medium"
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-green-600 dark:text-green-400"
                    }`}>{selectedReport?.urgency || "Low"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2 gap-4">
                    <span className="text-slate-500">Title:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{selectedReport?.title || "N/A"}</span>
                  </div>
                  <div className="grid border-b pb-2 gap-1">
                    <span className="text-slate-500">Description:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{selectedReport?.description || "No report description available."}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2 gap-4">
                    <span className="text-slate-500">Municipality/City:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{selectedReport?.municipality || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2 gap-4">
                    <span className="text-slate-500">Barangay:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{selectedReport?.barangay || "Unknown"}</span>
                  </div>
                  <div className="grid border-b pb-2 gap-1">
                    <span className="text-slate-500">Street Address:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{selectedReport?.streetAddress || "N/A"}</span>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-slate-500">Landmark:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{selectedReport?.landmark || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div>
                <Tabs defaultValue="reporter" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="reporter">Reporter Uploaded</TabsTrigger>
                    <TabsTrigger value="completion">Completion Proof</TabsTrigger>
                  </TabsList>

                  <TabsContent value="reporter" className="mt-3">
                    <ReportMediaGallery
                      title="Reporter Uploaded Images"
                      images={(selectedReport?.reporterPhotos || []).map((url, index) => ({
                        url,
                        alt: `Reporter image ${index + 1}`,
                      }))}
                      emptyText="No reporter images were uploaded for this report."
                    />
                  </TabsContent>

                  <TabsContent value="completion" className="mt-3">
                    <ReportMediaGallery
                      title="Completion Proof Images"
                      images={(selectedReport?.completionPhotos || []).map((url, index) => ({
                        url,
                        alt: `Completion proof ${index + 1}`,
                      }))}
                      emptyText="No completion proof has been submitted yet."
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
