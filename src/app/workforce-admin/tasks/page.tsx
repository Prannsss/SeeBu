"use client"

import { useState } from "react"
import { ClipboardList, Users, CheckCircle2, Clock, Link2, MapPin, AlertCircle } from "lucide-react" 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { gooeyToast } from "goey-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ReportMediaGallery } from "@/components/reports/report-media-gallery"
import { useCurrentUser } from "@/hooks/queries/useCurrentUser"
import { useRealtimeReports } from "@/hooks/useRealtimeReports"

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

type TaskItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  date: string;
  assignedToId: string | null;
  officer?: string;
  related_report_id?: string;
  related_report: LinkedReport | null;
  created_by: string;
};

export default function WorkforceAdminTasksPage() {
  useRealtimeReports({ enableToasts: true, userRole: "workforce-admin" });
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("Pending")
  const [delegateTo, setDelegateTo] = useState("")
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [modalDelegateMode, setModalDelegateMode] = useState(false)

  const { data: profileData } = useCurrentUser()

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
    queryKey: ['workforce-admin-tasks', departmentId],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      const deptId = departmentId;
      if (!deptId) throw new Error('No department assigned');
      
      const json = await apiClient.tasks.getAll({ delegated_to: deptId });
      return json.data;
    },
    enabled: !!departmentId,
    refetchInterval: 5000,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforce-admin-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  })

  const tasksList: TaskItem[] = Array.isArray(tasksData) ? tasksData.map(t => ({
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

  const handleDelegate = (taskId: string) => {
    if (!delegateTo) {
      gooeyToast.error("Error", { description: "Please select an officer first." })
      return
    }
    updateTaskMutation.mutate({ id: taskId, assigned_to: delegateTo, status: 'Assigned' }, {
      onSuccess: () => {
        gooeyToast.success("Success", { description: "Task accepted and assigned to officer successfully." })
        setDialogOpen(null)
        setSelectedTask(null)
        setModalDelegateMode(false)
        setDelegateTo("")
      },
      onError: (err: any) => {
        gooeyToast.error(err?.message?.trim() || "Failed to delegate task.")
      }
    })
  }

  const handleViewLinkedReport = (task: TaskItem) => {
    if (!task.related_report) {
      gooeyToast.error("Error", { description: "No linked report details available for this task yet." })
      return
    }
    setModalDelegateMode(false)
    setDelegateTo("")
    setSelectedTask(task)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-orange-100 text-orange-700 border-orange-200"
      case "Accepted": return "bg-blue-100 text-blue-700 border-blue-200"
      case "Assigned": return "bg-amber-100 text-amber-700 border-amber-200"
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
            <TabsTrigger value="Pending" className="flex-1 rounded-md py-2.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400">Pending Tasks</TabsTrigger>
            <TabsTrigger value="Assigned" className="flex-1 rounded-md py-2.5 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900/30 dark:data-[state=active]:text-amber-400">Assigned Tasks</TabsTrigger>
            <TabsTrigger value="Completed" className="flex-1 rounded-md py-2.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-400">Completed Tasks</TabsTrigger>
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
                        {!task.assignedToId && (
                          <Dialog open={dialogOpen === task.id} onOpenChange={(open) => {
                            setDialogOpen(open ? task.id : null);
                            if (!open) setDelegateTo("");
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
                                onClick={() => setDelegateTo("")}
                              >
                                Accept and Delegate
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 sm:p-7">
                              <DialogHeader>
                                <DialogTitle>Accept &amp; Delegate Task</DialogTitle>
                                <DialogDescription>Assign the field operation for {task.id} to an available workforce member.</DialogDescription>
                              </DialogHeader>

                              <div className="py-2 space-y-4">
                                {/* Compact Report Summary Banner */}
                                <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5">
                                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                      {task.id}
                                    </span>
                                    {task.related_report?.urgency && (
                                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                                        task.related_report.urgency === 'High'
                                          ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800'
                                          : task.related_report.urgency === 'Medium'
                                            ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800'
                                            : 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800'
                                      }`}>
                                        {task.related_report.urgency} Urgency
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {task.title}
                                  </div>
                                  {(task.related_report?.barangay || task.description) && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 truncate">
                                      <MapPin className="h-3 w-3 shrink-0" />
                                      <span>{task.related_report ? `${task.related_report.barangay}, ${task.related_report.municipality}` : task.description}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/60 dark:bg-blue-950/30 p-4">
                                  <label htmlFor="delegate-officer" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Workforce Officer *
                                  </label>
                                  <Select value={delegateTo} onValueChange={setDelegateTo}>
                                    <SelectTrigger id="delegate-officer" className="bg-white dark:bg-slate-900 border-slate-200">
                                      <SelectValue placeholder="Select workforce officer..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 z-[300]">
                                      {officers.map(o => (
                                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {officers.length === 0 && (
                                    <p className="text-xs text-red-500">No active officers available in your department.</p>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    setDialogOpen(null);
                                    setDelegateTo("");
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => handleDelegate(task.id)}
                                  disabled={!delegateTo || officers.length === 0 || updateTaskMutation.isPending}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {updateTaskMutation.isPending ? "Delegating..." : "Confirm Assignment"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
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

      {/* Linked Report & Delegation Dialog */}
      <Dialog open={Boolean(selectedTask)} onOpenChange={(open) => {
        if (!open) {
          setSelectedTask(null);
          setModalDelegateMode(false);
          setDelegateTo("");
        }
      }}>
        <DialogContent className={`w-[calc(100%-2rem)] ${modalDelegateMode ? 'sm:max-w-xl' : 'sm:max-w-5xl'} rounded-xl max-h-[88vh] overflow-y-auto p-5 sm:p-7 transition-all duration-200`}>
          <DialogHeader>
            <DialogTitle>
              {modalDelegateMode ? "Accept & Delegate Task" : (selectedTask?.related_report?.title || selectedTask?.title || "Linked Report")}
            </DialogTitle>
            <DialogDescription>
              {modalDelegateMode
                ? `Assign the field operation for ${selectedTask?.id} to an available workforce member.`
                : `Task ID: ${selectedTask?.id || "N/A"}${selectedTask?.related_report_id ? ` • Report ID: ${selectedTask.related_report_id}` : ''}`}
            </DialogDescription>
          </DialogHeader>

          {modalDelegateMode && selectedTask ? (
            <div className="py-2 space-y-4 animate-in fade-in duration-200">
              {/* Compact Report Summary Banner */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {selectedTask.id}
                  </span>
                  {selectedTask.related_report?.urgency && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                      selectedTask.related_report.urgency === 'High'
                        ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800'
                        : selectedTask.related_report.urgency === 'Medium'
                          ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800'
                          : 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800'
                    }`}>
                      {selectedTask.related_report.urgency} Urgency
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {selectedTask.title}
                </div>
                {(selectedTask.related_report?.barangay || selectedTask.description) && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>{selectedTask.related_report ? `${selectedTask.related_report.barangay}, ${selectedTask.related_report.municipality}` : selectedTask.description}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/60 dark:bg-blue-950/30 p-4">
                <label htmlFor="modal-delegate-officer" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Workforce Officer *
                </label>
                <Select value={delegateTo} onValueChange={setDelegateTo}>
                  <SelectTrigger id="modal-delegate-officer" className="bg-white dark:bg-slate-900 border-slate-200">
                    <SelectValue placeholder="Select workforce officer..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 z-[300]">
                    {officers.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {officers.length === 0 && (
                  <p className="text-xs text-red-500">No active officers available in your department.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900 h-fit">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Report Details</h4>
                  <div className="text-sm text-muted-foreground grid gap-2">
                    <div className="flex justify-between border-b pb-2 gap-4">
                      <span className="text-slate-500">Urgency Level:</span>
                      <span className={`font-medium text-right ${
                        selectedTask?.related_report?.urgency === "High"
                          ? "text-red-600 dark:text-red-400"
                          : selectedTask?.related_report?.urgency === "Medium"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-green-600 dark:text-green-400"
                      }`}>{selectedTask?.related_report?.urgency || "Low"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 gap-4">
                      <span className="text-slate-500">Title:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{selectedTask?.related_report?.title || selectedTask?.title || "N/A"}</span>
                    </div>
                    <div className="grid border-b pb-2 gap-1">
                      <span className="text-slate-500">Description:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{selectedTask?.related_report?.description || selectedTask?.description || "No report description available."}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 gap-4">
                      <span className="text-slate-500">Municipality/City:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{selectedTask?.related_report?.municipality || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 gap-4">
                      <span className="text-slate-500">Barangay:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{selectedTask?.related_report?.barangay || "Unknown"}</span>
                    </div>
                    <div className="grid border-b pb-2 gap-1">
                      <span className="text-slate-500">Street Address:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{selectedTask?.related_report?.streetAddress || "N/A"}</span>
                    </div>
                    <div className="grid gap-1">
                      <span className="text-slate-500">Landmark:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{selectedTask?.related_report?.landmark || "N/A"}</span>
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
                        images={(selectedTask?.related_report?.reporterPhotos || []).map((url, index) => ({
                          url,
                          alt: `Reporter image ${index + 1}`,
                        }))}
                        emptyText="No reporter images were uploaded for this report."
                      />
                    </TabsContent>

                    <TabsContent value="completion" className="mt-3">
                      <ReportMediaGallery
                        title="Completion Proof Images"
                        images={(selectedTask?.related_report?.completionPhotos || []).map((url, index) => ({
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
          )}

          {/* Modal Action Buttons */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4">
            {modalDelegateMode ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setModalDelegateMode(false);
                    setDelegateTo("");
                  }}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => selectedTask && handleDelegate(selectedTask.id)}
                  disabled={!delegateTo || officers.length === 0 || updateTaskMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updateTaskMutation.isPending ? "Delegating..." : "Confirm & Delegate"}
                </Button>
              </>
            ) : (
              selectedTask && !selectedTask.assignedToId ? (
                <Button
                  type="button"
                  className="col-span-full w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    setModalDelegateMode(true);
                    setDelegateTo("");
                  }}
                >
                  Accept and Delegate
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="col-span-full w-full"
                  onClick={() => setSelectedTask(null)}
                >
                  Close
                </Button>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

