"use client"

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, AlertTriangle, Link2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { gooeyToast } from "goey-toast";

export default function WorkforceTasks() {
  const [activeTab, setActiveTab] = useState("Assigned");

  type Task = {
    id: string;
    title: string;
    location: string;
    priority: string;
    status: string;
    time: string;
    related_report_id: string | null;
    completed_at: string | null;
  };

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "TSK-001",
      title: "Pothole Repair - Main St.",
      location: "123 Main St, Downtown",
      priority: "High",
      status: "Accepted",
      time: "Started 2 hours ago",
      related_report_id: "RPT-1079",
      completed_at: null,
    },
    {
      id: "TSK-002",
      title: "Street Sweeping - Zone A",
      location: "Zone A, North District",
      priority: "Medium",
      status: "Assigned",
      time: "Scheduled for 2:00 PM",
      related_report_id: null,
      completed_at: null,
    },
    {
      id: "TSK-003",
      title: "Broken Streetlight Replacement",
      location: "Oak Ave & 4th St",
      priority: "Low",
      status: "Completed",
      time: "Finished yesterday",
      related_report_id: "RPT-1077",
      completed_at: "Mar 22, 2026 • 4:00 PM",
    }
  ]);

  const filteredTasks = tasks.filter((task) => task.status === activeTab);

  const handleAcceptTask = (taskId: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: "Accepted" } : t
    ));
    gooeyToast.success("Task Accepted!", {
      description: "The task is now in progress. Good luck!",
    });
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: "Completed", completed_at: new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) } : t
    ));
    gooeyToast.success("Task Completed!", {
      description: "Great work! The task has been marked as done.",
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

  const handleButtonClick = (task: typeof tasks[0]) => {
    if (task.status === "Assigned") handleAcceptTask(task.id);
    else if (task.status === "Accepted") handleCompleteTask(task.id);
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
          <TabsTrigger
            value="Assigned"
            className="flex-1 text-sm md:text-base py-3 px-4 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out whitespace-nowrap"
          >
            Assigned
          </TabsTrigger>
          <TabsTrigger
            value="Accepted"
            className="flex-1 text-sm md:text-base py-3 px-4 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out whitespace-nowrap"
          >
            Accepted
          </TabsTrigger>
          <TabsTrigger
            value="Completed"
            className="flex-1 text-sm md:text-base py-3 px-4 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out whitespace-nowrap"
          >
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="m-0 focus-visible:outline-none">
          <div className="grid gap-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-10 col-span-full text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                No tasks found for this status.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <Card key={task.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">{task.id}</span>
                        <Badge 
                          variant={task.status === "Completed" ? "default" : task.status === "Accepted" ? "secondary" : "outline"}
                          className={
                            task.status === "Completed" ? "bg-emerald-500 hover:bg-emerald-600" : 
                            task.status === "Accepted" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : ""
                          }
                        >
                          {task.status}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-semibold mb-4">{task.title}</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <MapPin className="mr-2 h-4 w-4" />
                          {task.location}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="mr-2 h-4 w-4" />
                          {task.time}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Priority: {task.priority}
                        </div>
                      </div>

                      {/* related_report_id */}
                      {task.related_report_id && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                          <Link2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs text-muted-foreground">Linked Report:</span>
                          <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {task.related_report_id}
                          </span>
                        </div>
                      )}

                      {/* completed_at */}
                      {task.status === "Completed" && task.completed_at && (
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="text-xs text-muted-foreground">Completed:</span>
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{task.completed_at}</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-muted/50 px-6 py-4 flex items-center justify-center border-t md:border-t-0 md:border-l border-border md:w-48">
                      <button
                        onClick={() => handleButtonClick(task)}
                        className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white shadow transition-colors ${
                          task.status === 'Completed'
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : task.status === 'Accepted'
                            ? 'bg-amber-500 hover:bg-amber-600'
                            : 'bg-primary hover:bg-primary/90'
                        }`}
                      >
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
    </div>
    </div>
  );
}
