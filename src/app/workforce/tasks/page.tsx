"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, AlertTriangle, Link2, Camera, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { gooeyToast } from "goey-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function WorkforceTasks() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Assigned");

  // Modal states
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [completionRemarks, setCompletionRemarks] = useState("");
  const [completionPhotoUrl, setCompletionPhotoUrl] = useState("");

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['workforce-tasks'],
    queryFn: async () => {
      // NOTE: Uses dummy workforce ID for demo
      const res = await fetch('http://localhost:5000/api/v1/tasks?assigned_to=123e4567-e89b-12d3-a456-426614174004');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const json = await res.json();
      return json.data;
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (payload: { id: string, status: string }) => {
      const res = await fetch(`http://localhost:5000/api/v1/tasks/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer simulated-jwt-token' },
        body: JSON.stringify({ status: payload.status })
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workforce-tasks'] })
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (payload: { id: string, remarks?: string, photo_url?: string }) => {
      const res = await fetch(`http://localhost:5000/api/v1/tasks/${payload.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer simulated-jwt-token' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to complete task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforce-tasks'] });
      setCompletionModalOpen(false);
      setCompletionRemarks("");
      setCompletionPhotoUrl("");
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
    completed_at: t.completed_at ? new Date(t.completed_at).toLocaleString() : null
  })) : [];

  const filteredTasks = tasksList.filter((task: any) => task.status === activeTab);

  const handleAcceptTask = (taskId: string) => {
    updateTaskMutation.mutate({ id: taskId, status: 'Accepted' }, {
      onSuccess: () => gooeyToast.success("Task Accepted!", { description: "The task is now in progress. Good luck!" }),
      onError: (err) => gooeyToast.error(err.message)
    });
  };

  const handleOpenCompleteModal = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCompletionModalOpen(true);
  };

  const handleConfirmComplete = () => {
    if (!selectedTaskId) return;
    completeTaskMutation.mutate({ 
      id: selectedTaskId, 
      remarks: completionRemarks, 
      photo_url: completionPhotoUrl 
    }, {
      onSuccess: () => gooeyToast.success("Task Completed!", { description: "Great work! Proof submitted successfully." }),
      onError: (err) => gooeyToast.error(err.message)
    });
  };

  const getButtonText = (status: string) => {
    switch(status) {
      case "Assigned": return "Accept Task";
      case "Accepted": return "Mark as Complete";
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
                        <button onClick={() => handleButtonClick(task)} className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white shadow transition-colors ${task.status === 'Completed' ? 'bg-emerald-500 hover:bg-emerald-600' : task.status === 'Accepted' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'}`}>
                          {getButtonText(task.status)}
                        </button>
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
                <label className="text-sm font-medium flex items-center gap-2"><FileText className="w-4 h-4 text-slate-500" /> Completion Remarks / Notes</label>
                <Textarea placeholder="Describe what was done..." value={completionRemarks} onChange={(e) => setCompletionRemarks(e.target.value)} className="min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><Camera className="w-4 h-4 text-slate-500" /> Proof Photo URL</label>
                <Input placeholder="https://example.com/photo.jpg" value={completionPhotoUrl} onChange={(e) => setCompletionPhotoUrl(e.target.value)} />
                <p className="text-xs text-muted-foreground">For simulation purposes, paste a direct image link.</p>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
              <Button variant="outline" onClick={() => setCompletionModalOpen(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleConfirmComplete} disabled={completeTaskMutation.isPending}>
                {completeTaskMutation.isPending ? "Submitting..." : "Confirm & Complete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
