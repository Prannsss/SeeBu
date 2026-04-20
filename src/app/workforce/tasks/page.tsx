"use client";

import { useState, type ChangeEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, AlertTriangle, Link2, Camera } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { gooeyToast } from "goey-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReportMediaGallery } from "@/components/reports/report-media-gallery";

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

export default function WorkforceTasks() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Assigned");

  // Modal states
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [completionPhotoUrls, setCompletionPhotoUrls] = useState<string[]>([]);
  const [proofFileNames, setProofFileNames] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<LinkedReport | null>(null);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['workforce-tasks'],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      // Get current user's ID from profile
      const profileRes = await apiClient.users.me();
      const userId = profileRes.data?.id;
      if (!userId) throw new Error('Not authenticated');
      
      const json = await apiClient.tasks.getAll({ assigned_to: userId });
      return json.data;
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (payload: { id: string, status: string }) => {
      const { apiClient } = await import('@/lib/api');
      const res = await apiClient.tasks.update(payload.id, { status: payload.status });
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workforce-tasks'] })
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (payload: { id: string, photo_urls?: string[] }) => {
      const { apiClient } = await import('@/lib/api');
      const res = await apiClient.tasks.complete(payload.id, { 
        photo_urls: payload.photo_urls 
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforce-tasks'] });
      setCompletionModalOpen(false);
      setCompletionPhotoUrls([]);
      setProofFileNames([]);
    }
  });

  const tasksList = Array.isArray(tasksData) ? tasksData.map(t => ({
    id: t.id,
    title: t.title,
    location: t.location,
    priority: t.priority,
    status: t.status,
    time: `Created ${new Date(t.created_at).toLocaleDateString()}`,
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

  const filteredTasks = tasksList.filter((task: any) => task.status === activeTab);

  const handleAcceptTask = (taskId: string) => {
    updateTaskMutation.mutate({ id: taskId, status: 'Accepted' }, {
      onSuccess: () => gooeyToast.success("Task Accepted!", { description: "The task is now in progress. Good luck!" }),
      onError: (err) => gooeyToast.error(err?.message?.trim() || "Failed to accept task.")
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
      gooeyToast.error("You can upload up to 5 proof images only.");
      event.target.value = "";
      return;
    }

    const hasNonImage = files.some((file) => !file.type.startsWith("image/"));
    if (hasNonImage) {
      gooeyToast.error("Please upload image files only.");
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
      gooeyToast.error("Failed to read selected images. Please try again.");
      setCompletionPhotoUrls([]);
      setProofFileNames([]);
    }
  };

  const handleViewLinkedReport = (task: any) => {
    if (!task.related_report) {
      gooeyToast.error("No linked report details available yet.");
      return;
    }
    setSelectedReport(task.related_report);
  };

  const handleConfirmComplete = () => {
    if (!selectedTaskId) return;
    if (completionPhotoUrls.length === 0) {
      gooeyToast.error("Please upload at least one proof image before submitting.");
      return;
    }

    completeTaskMutation.mutate({ 
      id: selectedTaskId, 
      photo_urls: completionPhotoUrls 
    }, {
      onSuccess: () => gooeyToast.success("Task Completed!", { description: "Great work! Proof submitted successfully." }),
      onError: (err) => gooeyToast.error(err?.message?.trim() || "Failed to submit completion proof.")
    });
  };

  const getButtonText = (status: string) => {
    switch(status) {
      case "Assigned": return "Accept Task";
      case "Accepted": return "Upload and Mark as Complete";
      case "Completed": return "View Details";
      default: return "";
    }
  }

  const handleButtonClick = (task: any) => {
    if (task.status === "Assigned") handleAcceptTask(task.id);
    else if (task.status === "Accepted") handleOpenCompleteModal(task.id);
    else gooeyToast.info("Task Details", { description: `${task.title} was completed on ${task.completed_at ?? 'N/A'}.` });
  };

  return (
    <div className="min-h-screen bg-white pb-32 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage and update your operational tasks.</p>
        </div>

        <Tabs defaultValue="Assigned" onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full h-auto mb-6 bg-transparent border-b rounded-none p-0 overflow-x-auto no-scrollbar">
            <TabsTrigger value="Assigned" className="flex-1 text-sm md:text-base py-3 px-4 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out whitespace-nowrap">Assigned</TabsTrigger>
            <TabsTrigger value="Accepted" className="flex-1 text-sm md:text-base py-3 px-4 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out whitespace-nowrap">Accepted</TabsTrigger>
            <TabsTrigger value="Completed" className="flex-1 text-sm md:text-base py-3 px-4 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out whitespace-nowrap">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0 focus-visible:outline-none">
            <div className="grid gap-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-10 col-span-full text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                  No tasks found for this status.
                </div>
              ) : (
                filteredTasks.map((task: any) => (
                  <Card key={task.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">{task.id}</span>
                          <Badge variant={task.status === "Completed" ? "default" : task.status === "Accepted" ? "secondary" : "outline"} className={task.status === "Completed" ? "bg-emerald-500 hover:bg-emerald-600" : task.status === "Accepted" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : ""}>
                            {task.status}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-semibold mb-4">{task.title}</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center text-muted-foreground"><MapPin className="mr-2 h-4 w-4" /> {task.location}</div>
                          <div className="flex items-center text-muted-foreground"><Clock className="mr-2 h-4 w-4" /> {task.time}</div>
                          <div className="flex items-center text-muted-foreground"><AlertTriangle className="mr-2 h-4 w-4" /> Priority: {task.priority}</div>
                        </div>

                        {task.related_report_id && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                            <Link2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="text-xs text-muted-foreground">Linked Report:</span>
                            <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">{task.related_report_id}</span>
                          </div>
                        )}

                        {task.status === "Completed" && task.completed_at && (
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span className="text-xs text-muted-foreground">Completed:</span>
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{task.completed_at}</span>
                          </div>
                        )}
                      </div>
                      <div className="bg-muted/50 px-6 py-4 flex items-center justify-center border-t md:border-t-0 md:border-l border-border md:w-48">
                        <div className="w-full space-y-2">
                          <button onClick={() => handleButtonClick(task)} className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white shadow transition-colors ${task.status === 'Completed' ? 'bg-emerald-500 hover:bg-emerald-600' : task.status === 'Accepted' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary/90'}`}>
                            {getButtonText(task.status)}
                          </button>
                          {task.related_report_id ? (
                            <Button variant="outline" className="w-full" onClick={() => handleViewLinkedReport(task)}>
                              View Linked Report
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Proof of Completion Modal */}
        <Dialog open={completionModalOpen} onOpenChange={setCompletionModalOpen}>
          <DialogContent className="sm:max-w-md rounded-lg w-[calc(100%-2rem)]">
            <DialogHeader>
              <DialogTitle>Submit Proof of Completion</DialogTitle>
              <DialogDescription>
                Please provide details and photographic proof that the task has been resolved.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="proof-photo-upload" className="text-sm font-medium flex items-center gap-2"><Camera className="w-4 h-4 text-slate-500" /> Upload Proof Photos (up to 5)</label>
                <input
                  id="proof-photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleProofFileChange}
                  title="Upload proof photos"
                  className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
                />
                {proofFileNames.length > 0 ? (
                  <p className="text-xs text-muted-foreground">Selected: {proofFileNames.length} image(s)</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Choose up to 5 images to submit as completion proof.</p>
                )}
                {completionPhotoUrls.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {completionPhotoUrls.map((url, index) => (
                      <div key={`${url}-${index}`} className="overflow-hidden rounded-lg border border-slate-200">
                        <img
                          src={url}
                          alt={`Completion proof preview ${index + 1}`}
                          className="h-24 w-full object-cover bg-slate-50"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
              <Button className="bg-[#13b6ec] hover:bg-[#0fa6d8] text-white" onClick={() => setCompletionModalOpen(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleConfirmComplete} disabled={completeTaskMutation.isPending || completionPhotoUrls.length === 0}>
                {completeTaskMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
    </div>
  );
}
