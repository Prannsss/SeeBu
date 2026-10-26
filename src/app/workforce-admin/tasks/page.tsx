"use client"

import { useEffect, useState } from "react"
import { ClipboardList, Users, CheckCircle2, Clock, Link2, MapPin, AlertTriangle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { gooeyToast } from "goey-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { ReportMediaGallery } from "@/components/reports/report-media-gallery"
import { ListSkeleton } from "@/components/ui/list-skeleton"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { StickyTabsBar, scrollToStickyTabs } from "@/components/ui/sticky-tabs-bar"
import { useCurrentUser } from "@/hooks/queries/useCurrentUser"
import { useRealtimeReports } from "@/hooks/useRealtimeReports"
import { statusBadgeClass, urgencyBadgeClass } from "@/lib/status-styles"

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
  location: string;
  priority: string;
  status: string;
  date: string;
  completedAt: string | null;
  assignedToId: string | null;
  officer?: string;
  /** False when the officer holding it has left (e.g. their access was revoked): it needs reassigning. */
  officerActive: boolean;
  related_report_id?: string;
  related_report: LinkedReport | null;
};

type TabKey = "Pending" | "Assigned" | "Completed";
const TABS: TabKey[] = ["Pending", "Assigned", "Completed"];
const PAGE_SIZE = 10;

const EMPTY_TEXT: Record<TabKey, { title: string; hint: string }> = {
  Pending: { title: "No tasks waiting for delegation", hint: "New tasks routed to your department will appear here." },
  Assigned: { title: "No tasks with officers right now", hint: "Tasks you delegate stay here until the officer completes them." },
  Completed: { title: "No completed tasks yet", hint: "Finished tasks and their proof photos will be listed here." },
};

// A task belongs to "Assigned" as soon as an officer holds it (Pending, Assigned, Accepted, In Progress).
const tabOf = (task: TaskItem): TabKey =>
  task.status === "Completed" ? "Completed" : task.assignedToId ? "Assigned" : "Pending";

// Officers "accept" a task when they start the field work.
const statusLabel = (status: string) => (status === "Accepted" ? "In Progress" : status);

export default function WorkforceAdminTasksPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabKey>("Pending")
  const [page, setPage] = useState(1)
  const [delegateTo, setDelegateTo] = useState("")
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [modalDelegateMode, setModalDelegateMode] = useState(false)

  const { data: profileData, isLoading: isProfileLoading } = useCurrentUser()
  useRealtimeReports({ enableToasts: true, userRole: "workforce-admin", userId: profileData?.id });

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

  const personnel = (Array.isArray(officersData) ? officersData : []).filter((person: any) => person.role === 'workforce')
  const officerLabel = (person: any) => person.officer_role ? `${person.full_name} (${person.officer_role})` : person.full_name
  // Only active officers can take new work, but names resolve for everyone (e.g. who completed a task).
  const officers = personnel
    .filter((person: any) => String(person.status || '').toLowerCase() === 'active')
    .map((person: any) => ({ id: person.id, name: officerLabel(person) }));
  const officerNameById = new Map<string, string>(personnel.map((person: any) => [person.id, officerLabel(person)]));
  const activeOfficerIds = new Set(officers.map((o: { id: string }) => o.id));

  // One page of the active tab at a time; the tab split (Pending/Assigned/Completed) is done server-side.
  const { data: tasksPage, isPending: isTasksPending, isPlaceholderData } = useQuery({
    queryKey: ['workforce-admin-tasks', departmentId, activeTab, page],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      return apiClient.tasks.getAll({ delegated_to: departmentId, tab: activeTab, page, page_size: PAGE_SIZE });
    },
    // Keep the current page on screen while the next page of the same tab loads.
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[2] === activeTab ? previous : undefined,
    enabled: !!departmentId,
  })
  const tasksData = tasksPage?.data
  const totalTasks: number = tasksPage?.pagination?.total ?? 0
  const isLoading = isProfileLoading || (!!departmentId && isTasksPending)

  // Tab totals in their own query so they stay put while switching tabs or pages.
  const { data: tabCounts } = useQuery({
    queryKey: ['workforce-admin-tasks', departmentId, 'counts'],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      const json = await apiClient.tasks.getAll({ delegated_to: departmentId, page: 1, page_size: 1, count_tabs: true });
      return json.counts as Record<TabKey, number> | undefined;
    },
    placeholderData: keepPreviousData,
    enabled: !!departmentId,
  })

  // Delegating or completing a task can empty the last page — step back to the new last page.
  const totalPages: number | undefined = tasksPage?.pagination?.total_pages
  useEffect(() => {
    if (totalPages && page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const changeTab = (tab: TabKey) => { setActiveTab(tab); setPage(1); scrollToStickyTabs() }
  const changePage = (next: number) => {
    setPage(next)
    scrollToStickyTabs()
  }

  const updateTaskMutation = useMutation({
    mutationFn: async (payload: { id: string, status?: string, assigned_to?: string }) => {
      const { apiClient } = await import('@/lib/api');
      return apiClient.tasks.update(payload.id, {
        status: payload.status,
        assigned_to: payload.assigned_to
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforce-admin-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  })

  const tasksList: TaskItem[] = Array.isArray(tasksData) ? tasksData.map((t: any) => ({
    id: t.id,
    title: t.title,
    location: t.location || "N/A",
    priority: t.priority || "Medium",
    status: t.status,
    date: new Date(t.created_at).toLocaleDateString(),
    completedAt: t.completed_at ? new Date(t.completed_at).toLocaleString() : null,
    assignedToId: t.assigned_to || null,
    officer: t.assigned_to ? officerNameById.get(t.assigned_to) || "Assigned officer" : undefined,
    officerActive: !t.assigned_to || !Array.isArray(officersData) || activeOfficerIds.has(t.assigned_to),
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
  })) : []

  const tabLabel = (tab: TabKey) => (tabCounts?.[tab] !== undefined ? `${tab} (${tabCounts[tab]})` : tab)

  // Delegating a task an officer already holds hands it to someone else.
  const isReassign = Boolean(selectedTask && tabOf(selectedTask) === "Assigned")
  const officerChoices = isReassign ? officers.filter((o: { id: string }) => o.id !== selectedTask?.assignedToId) : officers

  const closeTaskModal = () => {
    setSelectedTask(null)
    setModalDelegateMode(false)
    setDelegateTo("")
  }

  const handleDelegate = (taskId: string) => {
    if (!delegateTo) {
      gooeyToast.error("Error", { description: "Please select an officer first." })
      return
    }
    const officerName = officers.find((o: { id: string; name: string }) => o.id === delegateTo)?.name || "the officer"
    // A reassigned task starts over as 'Assigned' for the new officer.
    updateTaskMutation.mutate({ id: taskId, assigned_to: delegateTo, status: 'Assigned' }, {
      onSuccess: () => {
        gooeyToast.success("Success", {
          description: isReassign ? `Task reassigned to ${officerName}.` : "Task accepted and assigned to officer successfully.",
        })
        closeTaskModal()
      },
      onError: (err: any) => {
        gooeyToast.error(err?.message?.trim() || "Failed to delegate task.")
      }
    })
  }

  // delegate=true opens straight into officer selection; otherwise shows the linked report.
  const openTask = (task: TaskItem, delegate: boolean) => {
    if (!delegate && !task.related_report) {
      gooeyToast.error("Error", { description: "No linked report details available for this task yet." })
      return
    }
    setDelegateTo("")
    setModalDelegateMode(delegate)
    setSelectedTask(task)
  }

  const renderTaskCard = (task: TaskItem) => {
    const isCompleted = task.status === "Completed"
    const urgency = task.related_report?.urgency || task.priority
    return (
      <Card key={task.id} className="overflow-hidden hover:shadow-md transition-shadow dark:bg-slate-900">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-3">
              <Badge variant="outline" className="font-mono text-xs">{task.id}</Badge>
              <Badge variant="outline" className={statusBadgeClass(task.status)}>{statusLabel(task.status)}</Badge>
            </div>
            <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
            <p className="text-slate-600 mt-2 text-sm flex items-start gap-1.5">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              {task.location}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 border-t pt-4 text-sm">
              <div className="flex items-center text-slate-600">
                <Clock className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" /> Logged: {task.date}
              </div>
              {task.related_report_id && (
                <div className="flex items-center text-slate-600 min-w-0">
                  <Link2 className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" /> Report: <span className="font-medium text-blue-600 ml-1 truncate">{task.related_report_id}</span>
                </div>
              )}
              {urgency && (
                <div className="flex items-center text-slate-600">
                  <AlertTriangle className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" /> Priority: <Badge variant="outline" className={`ml-1 capitalize ${urgencyBadgeClass(urgency)}`}>{urgency}</Badge>
                </div>
              )}
              <div className="flex items-center text-slate-600 min-w-0">
                <Users className="w-4 h-4 mr-2 shrink-0" aria-hidden="true" /> {isCompleted ? "Completed by" : "Assignee"}: <span className="font-medium text-slate-900 dark:text-slate-200 ml-1 truncate">{task.officer || "Unassigned"}</span>
                {!isCompleted && !task.officerActive && (
                  <span className="ml-2 shrink-0 text-xs font-semibold text-red-700">No longer active</span>
                )}
              </div>
              {isCompleted && task.completedAt && (
                <div className="flex items-center text-slate-600">
                  <CheckCircle2 className="w-4 h-4 mr-2 shrink-0 text-emerald-600" aria-hidden="true" /> Completed: <span className="font-medium text-emerald-600 ml-1">{task.completedAt}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-6 border-t md:border-t-0 md:border-l flex flex-col justify-center gap-3 md:min-w-[240px]">
            {tabOf(task) === "Pending" && (
              <Button
                className="w-full bg-primary hover:bg-primary-dark text-white shadow-sm font-semibold rounded-md h-9"
                onClick={() => openTask(task, true)}
              >
                Accept and Delegate
              </Button>
            )}
            {tabOf(task) === "Assigned" && (
              <Button
                variant="outline"
                className={task.officerActive
                  ? "w-full border-slate-300 text-slate-900 font-semibold rounded-md h-9"
                  : "w-full bg-primary hover:bg-primary-dark text-white hover:text-white border-primary shadow-sm font-semibold rounded-md h-9"}
                onClick={() => openTask(task, true)}
              >
                Reassign
              </Button>
            )}
            {task.related_report_id && (
              <Button
                variant="outline"
                className="w-full border-slate-300 text-slate-900 font-semibold rounded-md h-9"
                onClick={() => openTask(task, false)}
              >
                View Linked Report
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50">
            <ClipboardList className="h-6 w-6 text-orange-700 dark:text-orange-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Department Tasks</h1>
            <p className="text-slate-600 mt-1">Review department assignments and delegate to your workforce members.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => changeTab(value as TabKey)} className="w-full">
          <StickyTabsBar className="bg-slate-50/90 dark:bg-slate-950/90">
            <TabsList className="grid w-full grid-cols-3 h-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-1">
              <TabsTrigger value="Pending" className="rounded py-2 text-xs sm:text-sm font-semibold truncate data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">{tabLabel("Pending")}</TabsTrigger>
              <TabsTrigger value="Assigned" className="rounded py-2 text-xs sm:text-sm font-semibold truncate data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all">{tabLabel("Assigned")}</TabsTrigger>
              <TabsTrigger value="Completed" className="rounded py-2 text-xs sm:text-sm font-semibold truncate data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all">{tabLabel("Completed")}</TabsTrigger>
            </TabsList>
          </StickyTabsBar>

          {TABS.map((tab) => (
            <TabsContent key={tab} value={tab} className="m-0 focus-visible:outline-none">
              <div className={`grid gap-4 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`} aria-busy={isPlaceholderData}>
                {isLoading ? (
                  <ListSkeleton />
                ) : tasksList.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-12 px-4 bg-white rounded-md border border-dashed border-slate-300">
                    <ClipboardList className="w-10 h-10 text-slate-500 mb-3" aria-hidden="true" />
                    <p className="text-base font-semibold text-slate-900">{EMPTY_TEXT[tab].title}</p>
                    <p className="text-sm text-slate-600 mt-1">{EMPTY_TEXT[tab].hint}</p>
                  </div>
                ) : (
                  tasksList.map(renderTaskCard)
                )}
              </div>
              <PaginationBar
                page={page}
                pageSize={PAGE_SIZE}
                total={totalTasks}
                onPageChange={changePage}
                disabled={isPlaceholderData}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Linked Report & Delegation Dialog */}
      <Dialog open={Boolean(selectedTask)} onOpenChange={(open) => { if (!open) closeTaskModal(); }}>
        <DialogContent className={`w-[calc(100%-2rem)] ${modalDelegateMode ? 'sm:max-w-xl' : 'sm:max-w-5xl'} rounded-lg max-h-[88vh] overflow-y-auto p-5 sm:p-7 transition-all duration-200`}>
          <DialogHeader>
            <DialogTitle>
              {modalDelegateMode
                ? (isReassign ? "Reassign Task" : "Accept & Delegate Task")
                : (selectedTask?.related_report?.title || selectedTask?.title || "Linked Report")}
            </DialogTitle>
            <DialogDescription>
              {modalDelegateMode
                ? (isReassign
                  ? `Move ${selectedTask?.id} from ${selectedTask?.officer || "its current officer"} to another officer. They'll start it fresh.`
                  : `Assign the field operation for ${selectedTask?.id} to an available workforce member.`)
                : `Task ID: ${selectedTask?.id || "N/A"}${selectedTask?.related_report_id ? ` • Report ID: ${selectedTask.related_report_id}` : ''}`}
            </DialogDescription>
          </DialogHeader>

          {modalDelegateMode && selectedTask ? (
            <div className="py-2 space-y-4 animate-in fade-in duration-200">
              {/* Compact Report Summary Banner */}
              <div className="rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    {selectedTask.id}
                  </span>
                  {selectedTask.related_report?.urgency && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${urgencyBadgeClass(selectedTask.related_report.urgency)}`}>
                      {selectedTask.related_report.urgency} Urgency
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {selectedTask.title}
                </div>
                {(selectedTask.related_report?.barangay || selectedTask.location) && (
                  <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>{selectedTask.related_report ? `${selectedTask.related_report.barangay}, ${selectedTask.related_report.municipality}` : selectedTask.location}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-md border border-blue-200 bg-blue-50/60 dark:bg-blue-950/30 p-4">
                <label htmlFor="modal-delegate-officer" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Workforce Officer *
                </label>
                <Select value={delegateTo} onValueChange={setDelegateTo}>
                  <SelectTrigger id="modal-delegate-officer" className="bg-white dark:bg-slate-900 border-slate-200">
                    <SelectValue placeholder="Select workforce officer..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 z-[300]">
                    {officerChoices.map((o: { id: string; name: string }) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {officerChoices.length === 0 && (
                  <p className="text-xs text-red-700">
                    {isReassign ? "No other active officers in your department." : "No active officers available in your department."}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900 h-fit">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Report Details</h4>
                  <div className="text-sm text-slate-600 grid gap-2">
                    <div className="flex justify-between border-b pb-2 gap-4">
                      <span className="text-slate-600">Urgency Level:</span>
                      <Badge variant="outline" className={`capitalize ${urgencyBadgeClass(selectedTask?.related_report?.urgency || "Low")}`}>{selectedTask?.related_report?.urgency || "Low"}</Badge>
                    </div>
                    <div className="flex justify-between border-b pb-2 gap-4">
                      <span className="text-slate-600">Title:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{selectedTask?.related_report?.title || selectedTask?.title || "N/A"}</span>
                    </div>
                    <div className="grid border-b pb-2 gap-1">
                      <span className="text-slate-600">Description:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{selectedTask?.related_report?.description || "No report description available."}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 gap-4">
                      <span className="text-slate-600">Municipality/City:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{selectedTask?.related_report?.municipality || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 gap-4">
                      <span className="text-slate-600">Barangay:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{selectedTask?.related_report?.barangay || "Unknown"}</span>
                    </div>
                    <div className="grid border-b pb-2 gap-1">
                      <span className="text-slate-600">Street Address:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{selectedTask?.related_report?.streetAddress || "N/A"}</span>
                    </div>
                    <div className="grid gap-1">
                      <span className="text-slate-600">Landmark:</span>
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
                  className="w-full bg-sky-700 hover:bg-sky-800 text-white hover:text-white border-sky-700 font-bold"
                  onClick={() => {
                    // Back to the report view when there is one; otherwise this cancels.
                    if (selectedTask?.related_report) {
                      setModalDelegateMode(false);
                      setDelegateTo("");
                    } else {
                      closeTaskModal();
                    }
                  }}
                >
                  {selectedTask?.related_report ? "Back" : "Cancel"}
                </Button>
                <Button
                  type="button"
                  onClick={() => selectedTask && handleDelegate(selectedTask.id)}
                  disabled={!delegateTo || officerChoices.length === 0 || updateTaskMutation.isPending}
                  className="w-full bg-primary hover:bg-primary-dark text-white"
                >
                  {updateTaskMutation.isPending
                    ? (isReassign ? "Reassigning..." : "Delegating...")
                    : (isReassign ? "Confirm & Reassign" : "Confirm & Delegate")}
                </Button>
              </>
            ) : (
              selectedTask && tabOf(selectedTask) === "Pending" ? (
                <Button
                  type="button"
                  className="col-span-full w-full bg-primary hover:bg-primary-dark text-white"
                  onClick={() => {
                    setModalDelegateMode(true);
                    setDelegateTo("");
                  }}
                >
                  Accept and Delegate
                </Button>
              ) : isReassign ? (
                <>
                  <Button
                    type="button"
                    className="w-full bg-sky-700 hover:bg-sky-800 text-white hover:text-white border-sky-700 font-bold"
                    onClick={closeTaskModal}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    className="w-full bg-primary hover:bg-primary-dark text-white"
                    onClick={() => {
                      setModalDelegateMode(true);
                      setDelegateTo("");
                    }}
                  >
                    Reassign
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  className="col-span-full w-full bg-sky-700 hover:bg-sky-800 text-white hover:text-white border-sky-700 font-bold"
                  onClick={closeTaskModal}
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

