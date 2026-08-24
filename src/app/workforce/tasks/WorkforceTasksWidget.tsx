"use client";

import { useState, type ChangeEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, AlertTriangle, Link2, Camera, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { gooeyToast } from "goey-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTasks, useUpdateTaskStatus, useCompleteTask } from "@/hooks/queries/useTasks";
import { ReportMediaGallery } from "@/components/reports/report-media-gallery";
import { useRealtimeReports } from "@/hooks/useRealtimeReports";

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
  time: string;
  date: string;
  related_report_id?: string;
  completed_at: string | null;
  related_report: LinkedReport | null;
};

export function WorkforceTasksWidget({ userId }: { userId: string }) {
  useRealtimeReports({ enableToasts: true, userRole: "workforce" });
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Assigned");

  // Modal states
  const [confirmAcceptTask, setConfirmAcceptTask] = useState<TaskItem | null>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [completionPhotoUrls, setCompletionPhotoUrls] = useState<string[]>([]);
  const [proofFileNames, setProofFileNames] = useState<string[]>([]);
  const [selectedTaskForReport, setSelectedTaskForReport] = useState<TaskItem | null>(null);

  const { data: tasksData, isLoading } = useTasks({ assigned_to: userId });
  const { mutate: mutateTaskStatus, isPending: isUpdatingStatus } = useUpdateTaskStatus();
  const { mutate: completeTaskMutation, isPending: isCompletingTask } = useCompleteTask();

  const tasksList: TaskItem[] = Array.isArray(tasksData) ? tasksData.map((t: any) => ({
    id: t.id,
    title: t.title,
    location: t.location || "N/A",
    priority: t.priority || "Medium",
    status: t.status,
    time: `Logged: ${new Date(t.created_at).toLocaleDateString()}`,
    date: new Date(t.created_at).toLocaleDateString(),
    related_report_id: t.related_report_id,
    completed_at: t.completed_at ? new Date(t.completed_at).toLocaleString() : null,
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
  })) : [];

  const filteredTasks = tasksList.filter((task: TaskItem) => task.status === activeTab);

  const handleAcceptTask = (taskId: string) => {
    mutateTaskStatus({ taskId, status: 'Accepted' }, {
      onSuccess: () => gooeyToast.success("Task Accepted!", { description: "The task is now in progress. Good luck!" }),
      onError: (err: any) => gooeyToast.error("Error", { description: err?.message?.trim() || "Failed to accept task." })
    });
  };

  const handleOpenCompleteModal = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCompletionPhotoUrls([]);
    setProofFileNames([]);
    setCompletionModalOpen(true);
  };

  const handleProofFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (files.length > 5) {
      gooeyToast.error("Error", { description: "You can upload up to 5 proof images only." });
      event.target.value = "";
      return;
    }

    const hasNonImage = files.some((file) => !file.type.startsWith("image/"));
    if (hasNonImage) {
      gooeyToast.error("Error", { description: "Please upload image files only." });
      event.target.value = "";
      return;
    }

    try {
      const readAsDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result);
              return;
            }
            reject(new Error("Invalid image format"));
          };
          reader.onerror = () => reject(new Error("Failed to read image"));
          reader.readAsDataURL(file);
        });

      const photoUrls = await Promise.all(files.map(readAsDataUrl));
      setCompletionPhotoUrls(photoUrls);
      setProofFileNames(files.map((file) => file.name));
    } catch {
      gooeyToast.error("Error", { description: "Failed to read selected images. Please try again." });
      setCompletionPhotoUrls([]);
      setProofFileNames([]);
    }
  };

  const handleViewLinkedReport = (task: TaskItem) => {
    if (!task.related_report) {
      gooeyToast.error("No linked report details available yet.");
      return;
    }
    setSelectedTaskForReport(task);
  };

  const handleConfirmComplete = () => {
    if (!selectedTaskId) return;
    if (completionPhotoUrls.length === 0) {
      gooeyToast.error("Error", { description: "Please upload at least one proof image before submitting." });
      return;
    }

    completeTaskMutation({ 
      taskId: selectedTaskId, 
      photo_urls: completionPhotoUrls 
    }, {
      onSuccess: () => {
        setCompletionModalOpen(false);
        setCompletionPhotoUrls([]);
        setProofFileNames([]);
        gooeyToast.success("Task Completed!", { description: "Great work! Proof submitted successfully." });
      },
      onError: (err: any) => gooeyToast.error("Error", { description: err?.message?.trim() || "Failed to submit completion proof." })
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Assigned": return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400";
      case "Accepted": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
      case "Completed": return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400";
      default: return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage and update your assigned operational tasks.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex h-auto w-full bg-white dark:bg-slate-900 border rounded-lg p-1">
            <TabsTrigger value="Assigned" className="flex-1 rounded-md py-2.5 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900/30 dark:data-[state=active]:text-amber-400 font-medium">Assigned Tasks</TabsTrigger>
            <TabsTrigger value="Accepted" className="flex-1 rounded-md py-2.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400 font-medium">In Progress</TabsTrigger>
            <TabsTrigger value="Completed" className="flex-1 rounded-md py-2.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-400 font-medium">Completed Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0 focus-visible:outline-none">
            <div className="grid gap-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed">
                  No tasks found for this status.
                </div>
              ) : (
                filteredTasks.map((task: TaskItem) => (
                  <Card key={task.id} className="overflow-hidden hover:shadow-md transition-shadow dark:bg-slate-900">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="font-mono text-xs">{task.id}</Badge>
                          <Badge variant="secondary" className={getStatusColor(task.status)}>
                            {task.status === "Accepted" ? "In Progress" : task.status}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-semibold">{task.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">{task.location}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 border-t pt-4 text-sm">
                          <div className="flex items-center text-slate-500">
                            <Clock className="w-4 h-4 mr-2" /> Logged: {task.date}
                          </div>
                          {task.related_report_id && (
                            <div className="flex items-center text-slate-500">
                              <Link2 className="w-4 h-4 mr-2" /> Report: <span className="font-medium text-blue-600 ml-1">{task.related_report_id}</span>
                            </div>
                          )}
                          {(task.related_report?.urgency || task.priority) && (
                            <div className="flex items-center text-slate-500">
                              <AlertTriangle className="w-4 h-4 mr-2" /> Priority: <span className={`ml-1 font-medium ${
                                (task.related_report?.urgency || task.priority) === 'High' ? 'text-red-600 dark:text-red-400' :
                                (task.related_report?.urgency || task.priority) === 'Medium' ? 'text-amber-600 dark:text-amber-400' :
                                'text-green-600 dark:text-green-400'
                              }`}>{task.related_report?.urgency || task.priority}</span>
                            </div>
                          )}
                          {task.status === "Completed" && task.completed_at && (
                            <div className="flex items-center text-slate-500">
                              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Completed: <span className="font-medium text-emerald-600 ml-1">{task.completed_at}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 p-6 border-t md:border-t-0 md:border-l flex flex-col justify-center gap-3 min-w-[240px]">
                        {task.status === "Assigned" && (
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
                            onClick={() => setConfirmAcceptTask(task)}
                          >
                            Accept Task
                          </Button>
                        )}

                        {task.status === "Accepted" && (
                          <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium"
                            onClick={() => handleOpenCompleteModal(task.id)}
                          >
                            Upload &amp; Mark as Complete
                          </Button>
                        )}

                        {task.related_report_id && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleViewLinkedReport(task)}
                          >
                            View Linked Report
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Confirmation Modal for Accepting Task */}
        <Dialog open={Boolean(confirmAcceptTask)} onOpenChange={(open) => !open && setConfirmAcceptTask(null)}>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-xl">Accept Task</DialogTitle>
              <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                Are you sure you want to accept this task?
              </DialogDescription>
            </DialogHeader>

            {confirmAcceptTask && (
              <div className="py-2">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      {confirmAcceptTask.id}
                    </span>
                    {(confirmAcceptTask.related_report?.urgency || confirmAcceptTask.priority) && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                        (confirmAcceptTask.related_report?.urgency || confirmAcceptTask.priority) === 'High'
                          ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800'
                          : (confirmAcceptTask.related_report?.urgency || confirmAcceptTask.priority) === 'Medium'
                            ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800'
                            : 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800'
                      }`}>
                        {confirmAcceptTask.related_report?.urgency || confirmAcceptTask.priority} Priority
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {confirmAcceptTask.title}
                  </div>
                  {confirmAcceptTask.location && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{confirmAcceptTask.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setConfirmAcceptTask(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isUpdatingStatus}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                onClick={() => {
                  if (confirmAcceptTask) {
                    handleAcceptTask(confirmAcceptTask.id);
                    setConfirmAcceptTask(null);
                  }
                }}
              >
                {isUpdatingStatus ? "Accepting..." : "Yes, Accept Task"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Proof of Completion Modal */}
        <Dialog open={completionModalOpen} onOpenChange={setCompletionModalOpen}>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-xl">Submit Proof of Completion</DialogTitle>
              <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                Please provide photographic proof that the field task has been resolved.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-3">
              <div className="space-y-2">
                <label htmlFor="proof-photo-upload" className="text-sm font-medium flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-500" /> Upload Proof Photos (up to 5)
                </label>
                <input
                  id="proof-photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleProofFileChange}
                  title="Upload proof photos"
                  className="block w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
                />
                {proofFileNames.length > 0 ? (
                  <p className="text-xs text-muted-foreground">Selected: {proofFileNames.length} image(s)</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Choose up to 5 images to submit as completion proof.</p>
                )}
                {completionPhotoUrls.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {completionPhotoUrls.map((url, index) => (
                      <div key={`${url}-${index}`} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                        <img
                          src={url}
                          alt={`Completion proof preview ${index + 1}`}
                          className="h-24 w-full object-cover bg-slate-50 dark:bg-slate-900"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2">
              <Button variant="outline" className="w-full" onClick={() => setCompletionModalOpen(false)}>
                Cancel
              </Button>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleConfirmComplete}
                disabled={isCompletingTask || completionPhotoUrls.length === 0}
              >
                {isCompletingTask ? "Submitting..." : "Submit Proof"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Linked Report Modal */}
        <Dialog open={Boolean(selectedTaskForReport)} onOpenChange={(open) => !open && setSelectedTaskForReport(null)}>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-5xl rounded-xl max-h-[88vh] overflow-y-auto p-5 sm:p-7">
            <DialogHeader>
              <DialogTitle>{selectedTaskForReport?.related_report?.title || selectedTaskForReport?.title || "Linked Report"}</DialogTitle>
              <DialogDescription>
                Task ID: {selectedTaskForReport?.id || "N/A"}{selectedTaskForReport?.related_report_id ? ` • Report ID: ${selectedTaskForReport.related_report_id}` : ''}
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
                        selectedTaskForReport?.related_report?.urgency === "High"
                          ? "text-red-600 dark:text-red-400"
                          : selectedTaskForReport?.related_report?.urgency === "Medium"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-green-600 dark:text-green-400"
                      }`}>{selectedTaskForReport?.related_report?.urgency || "Low"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 gap-4">
                      <span className="text-slate-500">Title:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{selectedTaskForReport?.related_report?.title || selectedTaskForReport?.title || "N/A"}</span>
                    </div>
                    <div className="grid border-b pb-2 gap-1">
                      <span className="text-slate-500">Description:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{selectedTaskForReport?.related_report?.description || "No report description available."}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 gap-4">
                      <span className="text-slate-500">Municipality/City:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{selectedTaskForReport?.related_report?.municipality || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 gap-4">
                      <span className="text-slate-500">Barangay:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{selectedTaskForReport?.related_report?.barangay || "Unknown"}</span>
                    </div>
                    <div className="grid border-b pb-2 gap-1">
                      <span className="text-slate-500">Street Address:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{selectedTaskForReport?.related_report?.streetAddress || "N/A"}</span>
                    </div>
                    <div className="grid gap-1">
                      <span className="text-slate-500">Landmark:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{selectedTaskForReport?.related_report?.landmark || "N/A"}</span>
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
                        images={(selectedTaskForReport?.related_report?.reporterPhotos || []).map((url, index) => ({
                          url,
                          alt: `Reporter image ${index + 1}`,
                        }))}
                        emptyText="No reporter images were uploaded for this report."
                      />
                    </TabsContent>

                    <TabsContent value="completion" className="mt-3">
                      <ReportMediaGallery
                        title="Completion Proof Images"
                        images={(selectedTaskForReport?.related_report?.completionPhotos || []).map((url, index) => ({
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

            <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4">
              {selectedTaskForReport?.status === "Assigned" ? (
                <Button
                  type="button"
                  className="col-span-full w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    const task = selectedTaskForReport;
                    setSelectedTaskForReport(null);
                    setConfirmAcceptTask(task);
                  }}
                >
                  Accept Task
                </Button>
              ) : selectedTaskForReport?.status === "Accepted" ? (
                <Button
                  type="button"
                  className="col-span-full w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    const task = selectedTaskForReport;
                    setSelectedTaskForReport(null);
                    handleOpenCompleteModal(task.id);
                  }}
                >
                  Upload Proof
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="col-span-full w-full"
                  onClick={() => setSelectedTaskForReport(null)}
                >
                  Close
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
