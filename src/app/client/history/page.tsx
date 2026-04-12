"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock3, FileText, CheckCircle2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { useQuery } from '@tanstack/react-query'

function truncate(str: string, length = 60) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + "..." : str;
}

export default function ClientHistoryPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // In a real app we'd decode JWT or use a dedicated context. 
    // Since backend returns `user` in login, we realistically could store user Id in local storage or context.
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) {
      try {
        setUserId(JSON.parse(storedUserStr).id);
      } catch (e) {}
    }
  }, []);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['client-reports', userId],
    queryFn: async () => {
      // In production, append ?reporter_id=user.id to fetch user specific reports
      let url = 'http://localhost:5000/api/v1/reports';
      if (userId) url += `?reporter_id=${userId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const json = await res.json();
      return json.data;
    }
  });

  const items = reportData || [];

  const filteredItems = items.filter((item: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return ['In Review', 'Action Taken', 'Delegated', 'In Progress'].includes(item.status);
    if (activeTab === "resolved") return ['Resolved', 'Completed'].includes(item.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-white pb-32 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <Clock3 className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">History</h1>
            <p className="text-muted-foreground">Review your previous submissions and progress.</p>
          </div>
        </div>

        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full h-auto mb-6 bg-transparent border-b rounded-none p-0">
            <TabsTrigger 
              value="all" 
              className="flex-1 text-sm md:text-base py-3 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="pending" 
              className="flex-1 text-sm md:text-base py-3 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out"
            >
              Pending
            </TabsTrigger>
            <TabsTrigger 
              value="resolved" 
              className="flex-1 text-sm md:text-base py-3 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out"
            >
              Resolved
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="m-0 focus-visible:outline-none">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 col-span-full text-muted-foreground bg-white/50 rounded-xl border border-dashed border-gray-300">
                  No records found in this category.
                </div>
              ) : (
                filteredItems.map((item: any) => (
                  <Card key={item.id} className="border-blue-100/70 bg-white/85 backdrop-blur hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:items-center">
                      <div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription className="mt-1">{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</CardDescription>
                      </div>
                      <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50/50 mt-2 sm:mt-0 whitespace-nowrap">{item.id}</Badge>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="leading-snug">{truncate(item.description)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2 border-t pt-3">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</span>
                        <div className={`flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full ${
                          item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                          item.status === 'Action Taken' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        }`}>
                          {item.status === 'Resolved' && <CheckCircle2 className="h-4 w-4" />}
                          {item.status}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>


    </div>
  )
}
