"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle, Clock, XCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { gooeyToast } from "goey-toast";
import Image from "next/image";

import { useRouter, useSearchParams } from "next/navigation";

type TrackResult = {
  id: string;
  title: string;
  status: string;
  location: string;
  rejectionReason?: string;
  completionPhotos: string[];
  timeline: {
    id: string;
    status: string;
    notes?: string;
    date: string;
  }[];
};

const normalizeTrackingId = (value: string) => {
  const compact = value
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (compact.startsWith("RPT") && !compact.startsWith("RPT-")) {
    return compact.replace(/^RPT-?/, "RPT-");
  }

  return compact;
};

export default function TrackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(normalizeTrackingId(searchParams.get("id") || ""));
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);

  const fetchTracking = async (id: string) => {
    const { apiClient } = await import("@/lib/api");
    const { data } = await apiClient.reports.getByIdPublic(id);

    const sortedTimeline = (data.report_timeline || [])
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    return {
      id: data.id,
      title: data.title,
      status: data.status,
      location: `${data.location || ""}${data.barangays ? `, ${data.barangays.name}` : ""}${data.municipalities ? `, ${data.municipalities.name}` : ""}`.trim(),
      rejectionReason: data.rejection_reason,
      completionPhotos:
        data.report_photos
          ?.filter((p: any) => p.is_completion_photo)
          .map((p: any) => p.photo_url) || [],
      timeline: sortedTimeline.map((t: any) => ({
        id: t.id,
        status: t.status,
        notes: t.notes,
        date: new Date(t.created_at).toLocaleString(),
      })),
    } as TrackResult;
  };

  const getStatusKind = (status: string): "success" | "pending" | "rejected" => {
    const normalized = status.trim().toLowerCase();
    if (normalized === "rejected") return "rejected";
    if (normalized === "completed" || normalized === "resolved") return "success";
    return "pending";
  };

  const getStatusIcon = (status: string) => {
    const kind = getStatusKind(status);
    if (kind === "success") return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (kind === "rejected") return <XCircle className="h-5 w-5 text-red-600" />;
    return <Clock className="h-5 w-5 text-amber-600" />;
  };

  const getStatusCircleClass = (status: string) => {
    const kind = getStatusKind(status);
    if (kind === "success") return "bg-green-50 border-green-200";
    if (kind === "rejected") return "bg-red-50 border-red-200";
    return "bg-amber-50 border-amber-200";
  };

  const getTimelineDisplayKind = (status: string, index: number) => {
    const isLatestEvent = index === 0;
    const kind = getStatusKind(status);
    const normalizedStatus = status.trim().toLowerCase();
    if (kind === "rejected") return "rejected" as const;
    if (isLatestEvent && (normalizedStatus === "assigned" || normalizedStatus === "accepted")) {
      return "success" as const;
    }
    if (!isLatestEvent) return "success" as const;
    return kind;
  };

  const getTimelineIcon = (status: string, index: number) => {
    const kind = getTimelineDisplayKind(status, index);
    if (kind === "success") return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (kind === "rejected") return <XCircle className="h-5 w-5 text-red-600" />;
    return <Clock className="h-5 w-5 text-amber-600" />;
  };

  const getTimelineCircleClass = (status: string, index: number) => {
    const kind = getTimelineDisplayKind(status, index);
    if (kind === "success") return "bg-green-50 border-green-200";
    if (kind === "rejected") return "bg-red-50 border-red-200";
    return "bg-amber-50 border-amber-200";
  };

  useEffect(() => {
    const initialId = searchParams.get("id");
    if (!initialId) return;

    void (async () => {
      try {
        const normalizedId = normalizeTrackingId(initialId);
        if (!normalizedId) {
          setResult(null);
          return;
        }
        const record = await fetchTracking(normalizedId);
        setResult(record);
      } catch {
        setResult(null);
      }
    })();
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = normalizeTrackingId(trackingNumber);
    if (!id) return;

    setIsSearching(true);
    try {
      const record = await fetchTracking(id);
      setResult(record);
      setTrackingNumber(id);
      router.replace(`/track?id=${id}`);

      gooeyToast.success("Report Found", {
        description: `Showing status for ${id}.`,
      });

    } catch {
      setResult(null);
      gooeyToast.error("Error", {
        description: "Failed to find the tracking number."
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center p-6 w-full max-w-2xl mx-auto pt-24 pb-12">
        <div className="bg-white dark:bg-gray-900 shadow-xl rounded-3xl p-8 w-full border border-gray-100 dark:border-gray-800 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2">
            Track Issue
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm sm:text-base">
            Enter the tracking number provided when you submitted your report to
            view its current status.
          </p>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="e.g. RPT-1234"
                className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-gray-900 dark:text-white uppercase font-mono tracking-wider"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                maxLength={20}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold h-14 rounded-2xl text-lg shadow-lg disabled:opacity-70 transition-all"
              disabled={isSearching || !trackingNumber.trim()}
            >
              {isSearching ? "Searching..." : "Track Status"}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Need help finding your tracking number?</p>
          <p>
            Check the email address you provided when submitting the report.
          </p>
        </div>

        {result ? (
          <div className="mt-6 w-full space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 text-left shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Tracking ID</p>
                  <p className="font-mono font-semibold text-primary">{result.id}</p>
                </div>
                <div className={`h-10 w-10 rounded-full border flex items-center justify-center ${getStatusCircleClass(result.status)}`}>
                  {getStatusIcon(result.status)}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Title</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{result.title}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Location</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{result.location || "No location details available."}</p>
                </div>
              </div>

              <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-medium">
                Status: <span className="ml-1 font-bold">{result.status}</span>
              </div>

              {result.status === "Rejected" && result.rejectionReason ? (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl">
                  <h3 className="text-red-800 dark:text-red-400 font-bold mb-1 flex items-center gap-2">
                    <XCircle className="h-4 w-4" /> Reason for Rejection
                  </h3>
                  <p className="text-red-700 dark:text-red-300 text-sm">{result.rejectionReason}</p>
                </div>
              ) : null}

              {(result.status === "Completed" || result.status === "Resolved") && result.completionPhotos.length > 0 ? (
                <div className="space-y-3 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Completion Proof
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {result.completionPhotos.map((url, i) => (
                      <div key={`${url}-${i}`} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <Image src={url} alt="Completion" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm relative text-left">
              <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Timeline History</h3>
              <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {result.timeline.map((event, index) => (
                  <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${getTimelineCircleClass(event.status, index)}`}>
                      {getTimelineIcon(event.status, index)}
                    </div>

                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white">{event.status}</h4>
                        <time className="text-xs font-medium text-slate-500">{event.date}</time>
                      </div>
                      {event.notes ? <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{event.notes}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
