"use client"

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WorkforceTasks() {
  const [activeTab, setActiveTab] = useState("Assigned");

  const [tasks, setTasks] = useState([
    {
      id: "TSK-001",
      title: "Pothole Repair - Main St.",
      location: "123 Main St, Downtown",
      priority: "High",
      status: "Accepted",
      time: "Started 2 hours ago"
    },
    {
      id: "TSK-002",
      title: "Street Sweeping - Zone A",
      location: "Zone A, North District",
      priority: "Medium",
      status: "Assigned",
      time: "Scheduled for 2:00 PM"
    },
    {
      id: "TSK-003",
      title: "Broken Streetlight Replacement",
      location: "Oak Ave & 4th St",
      priority: "Low",
      status: "Completed",
      time: "Finished yesterday"
    }
  ]);

  const filteredTasks = tasks.filter((task) => task.status === activeTab);

  const getButtonText = (status: string) => {
    switch(status) {
      case "Assigned": return "Accept Task";
      case "Accepted": return "Upload Proof / Complete";
      case "Completed": return "View Details";
      default: return "";
    }
  }

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
                    </div>
                    <div className="bg-muted/50 px-6 py-4 flex items-center justify-center border-t md:border-t-0 md:border-l border-border md:w-48">
                      <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors">
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
