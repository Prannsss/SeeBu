"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";
import { gooeyToast } from "goey-toast";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

type TimelineEvent = {
  id: string;
  status: string;
  notes?: string;
  date: string;
};

type MockData = {
  status: string;
  title: string;
  location: string;
  rejection_reason?: string;
  completion_photos?: string[];
  timeline: TimelineEvent[];
};

const MOCK_DB: Record<string, MockData> = {
  "RPT-123": {
    status: "Completed",
    title: "Pothole on Main St.",
    location: "Main St, Cebu City",
    completion_photos: ["https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400"],
    timeline: [
      { id: "1", status: "In Review", date: "2024-03-20 10:00 AM", notes: "Report submitted." },
      { id: "2", status: "Approved", date: "2024-03-20 11:30 AM", notes: "Verified by Admin." },
      { id: "3", status: "Delegated", date: "2024-03-21 09:00 AM", notes: "Assigned to Public Works." },
      { id: "4", status: "In Progress", date: "2024-03-22 08:00 AM", notes: "Team dispatched." },
      { id: "5", status: "Completed", date: "2024-03-22 04:00 PM", notes: "Pothole patched." }
    ]
  },
  "RPT-404": {
    status: "Rejected",
    title: "Unknown noise",
    location: "Central, Cebu City",
    rejection_reason: "Insufficient details provided to locate the issue. Please submit a new report with photos.",
    timeline: [
      { id: "1", status: "In Review", date: "2024-03-21 14:00 PM", notes: "Report submitted." },
      { id: "2", status: "Rejected", date: "2024-03-21 15:00 PM", notes: "Report rejected by Admin." }
    ]
  }
};

export default function TrackingPage() {
  const searchParams = useSearchParams();
  const defaultQuery = searchParams.get("id") || "";
  const [trackingNumber, setTrackingNumber] = useState(defaultQuery);
  const [result, setResult] = useState<MockData | null>(null);

  // Trigger search on mount if a query parameter exists
  useEffect(() => {
    if (defaultQuery) {
      handleTrack(new Event("submit") as any);
    }
  }, [defaultQuery]);

const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber) return;

    try {
      const res = await fetch(`http://localhost:5000/api/v1/reports/${trackingNumber.toUpperCase()}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("No report matches that tracking number. Please check and try again.");
        throw new Error("Failed to fetch report");
      }
      
      const { data } = await res.json();
      
      // Transform backend data to frontend MockData structure
      const formattedData: MockData = {
        title: data.title,
        status: data.status,
        location: `${data.location}${data.barangays ? `, ${data.barangays.name}` : ''}${data.municipalities ? `, ${data.municipalities.name}` : ''}`,
        rejection_reason: data.rejection_reason,
        completion_photos: data.report_photos?.filter((p: any) => p.is_completion_photo).map((p: any) => p.photo_url) || [],
        timeline: data.report_timeline?.map((t: any) => ({
          id: t.id,
          status: t.status,
          date: new Date(t.created_at).toLocaleString(),
          notes: t.notes
        })).sort((a: any, b: any) => new Date(a.date).getTime() < new Date(b.date).getTime() ? 1 : -1) || []
      };

      setResult(formattedData);
      gooeyToast.success("Report Found!", {
        description: `Showing status for ${data.id}.`,     
      });
    } catch (err: any) {
      setResult(null);
      gooeyToast.error("Not Found", {
        description: err.message || "No report matches that tracking number.",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed": return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "Rejected": return <XCircle className="h-6 w-6 text-red-500" />;
      case "In Progress": return <Clock className="h-6 w-6 text-blue-500" />;
      default: return <AlertTriangle className="h-6 w-6 text-amber-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
      <div className="container mx-auto max-w-2xl px-4 pt-16 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Track Report</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Enter your tracking number (e.g., RPT-123, RPT-404)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          <form onSubmit={handleTrack} className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                id="tracking"
                type="text"
                placeholder="RPT-XXXX"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary uppercase text-lg transition-all"
                required
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            
            <Button type="submit" className="w-full py-6 text-lg font-bold shadow-lg">
              Track Status
            </Button>
          </form>
        </div>

        {result && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{result.title}</h2>
                  <p className="text-slate-500">{result.location}</p>
                </div>
                {getStatusIcon(result.status)}
              </div>
              
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-medium">
                Status: <span className="ml-1 font-bold">{result.status}</span>
              </div>

              {result.status === "Rejected" && result.rejection_reason && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl">
                  <h3 className="text-red-800 dark:text-red-400 font-bold mb-1 flex items-center gap-2">
                    <XCircle className="h-4 w-4" /> Reason for Rejection
                  </h3>
                  <p className="text-red-700 dark:text-red-300 text-sm">{result.rejection_reason}</p>
                </div>
              )}

              {result.status === "Completed" && result.completion_photos && result.completion_photos.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Completion Proof
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {result.completion_photos.map((url, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <Image src={url} alt="Completion" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative">
              <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Timeline History</h3>
              <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {result.timeline.map((event, index) => (
                  <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      {getStatusIcon(event.status)}
                    </div>
                    
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white">{event.status}</h4>
                        <time className="text-xs font-medium text-slate-500">{event.date}</time>
                      </div>
                      {event.notes && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{event.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
