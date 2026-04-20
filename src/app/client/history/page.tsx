"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock3, FileText, CheckCircle2, Copy } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { useQuery } from '@tanstack/react-query'
import { gooeyToast } from "goey-toast"

function truncate(str: string, length = 60) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + "..." : str;
}

export default function ClientHistoryPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyTracking = async (trackingId: string) => {
    try {
      await navigator.clipboard.writeText(trackingId);
      setCopiedId(trackingId);
      gooeyToast.success("Tracking ID copied.");
      setTimeout(() => setCopiedId((current) => (current === trackingId ? null : current)), 1500);
    } catch {
      gooeyToast.error("Unable to copy tracking ID.");
    }
  };

  const decodeJwtPayload = (token: string) => {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    // JWT payload uses base64url encoding, so normalize before decoding.
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  };

  const getFallbackIdentityFromCookie = () => {
    if (typeof document === 'undefined') return { id: null as string | null, email: null as string | null };
    const match = document.cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
    if (!match?.[1]) return { id: null as string | null, email: null as string | null };

    try {
      const token = decodeURIComponent(match[1]);
      const payload = decodeJwtPayload(token);
      const payloadId = payload?.id || payload?.uuid || payload?.user_id || payload?.client_id || payload?.sub || null;
      return {
        id: payloadId,
        email: payload?.email || null,
      };
    } catch {
      return { id: null as string | null, email: null as string | null };
    }
  };

  const { data: profileData } = useQuery({
    queryKey: ['client-me'],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      try {
        const json = await apiClient.users.me();
        return json.data;
      } catch {
        return null;
      }
    },
  });

  const fallbackIdentity = getFallbackIdentityFromCookie();
  const userId = profileData?.id || profileData?.uuid || profileData?.user_id || profileData?.client_id || fallbackIdentity.id;
  const userEmail = profileData?.email || fallbackIdentity.email;

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['client-reports', userId, userEmail],
    queryFn: async () => {
      if (!userId && !userEmail) return [];
      const { apiClient } = await import('@/lib/api');
      const json = await apiClient.reports.getAll({
        reporter_id: userId || undefined,
        reporter_email: userEmail || undefined,
      });
      return json.data || [];
    },
    enabled: !!userId || !!userEmail
  });

  const items = reportData || [];

  const filteredItems = items.filter((item: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return !['Resolved', 'Completed'].includes(item.status);
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
                      <div className="mt-2 sm:mt-0 flex items-center gap-2">
                        <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50/50 whitespace-nowrap">{item.id}</Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-blue-200 text-blue-700 hover:bg-blue-50"
                          onClick={() => handleCopyTracking(item.id)}
                          aria-label={`Copy tracking ID ${item.id}`}
                        >
                          {copiedId === item.id ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="leading-snug">{truncate(item.description)}</span>
                      </div>
                      {Array.isArray(item.report_photos) && item.report_photos.length > 0 ? (
                        <div className="flex items-center gap-2">
                          {item.report_photos.slice(0, 3).map((photo: any, idx: number) => (
                            <div key={`${item.id}-photo-${idx}`} className="h-12 w-12 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                              <img
                                src={photo.photo_url}
                                alt={`Report ${item.id} photo ${idx + 1}`}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                          {item.report_photos.length > 3 ? (
                            <span className="text-xs text-slate-500">+{item.report_photos.length - 3} more</span>
                          ) : null}
                        </div>
                      ) : null}
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
