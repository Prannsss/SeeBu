"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Clock3, 
  FileText, 
  CheckCircle2, 
  Copy, 
  MapPin, 
  AlertCircle, 
  Calendar, 
  Image as ImageIcon, 
  Clock, 
  XCircle, 
  Eye, 
  Search, 
  Filter, 
  ExternalLink,
  Camera
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useQuery } from '@tanstack/react-query'
import { gooeyToast } from "goey-toast"
import { useCurrentUser } from "@/hooks/queries/useCurrentUser"
import { useRealtimeReports } from "@/hooks/useRealtimeReports"
import { ReportMediaGallery } from "@/components/reports/report-media-gallery"
import { statusBadgeClass, urgencyBadgeClass } from "@/lib/status-styles"
import Link from "next/link"

export default function ClientHistoryPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCopyTracking = async (trackingId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    try {
      await navigator.clipboard.writeText(trackingId);
      setCopiedId(trackingId);
      gooeyToast.success("Tracking ID copied.");
      setTimeout(() => setCopiedId((current) => (current === trackingId ? null : current)), 1500);
    } catch {
      gooeyToast.error("Unable to copy tracking ID.");
    }
  };

  const { data: profileData } = useCurrentUser();

  const userId = profileData?.id || profileData?.uuid || profileData?.user_id || profileData?.client_id;
  const userEmail = profileData?.email;
  useRealtimeReports({ enableToasts: false, userRole: "client", userId });

  const { data: rawReportData, isLoading } = useQuery({
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
    enabled: !!userId || !!userEmail,
  });

  const reportsList = Array.isArray(rawReportData) ? rawReportData.map((r: any) => ({
    id: r.id,
    title: r.title || "Untitled Report",
    issueType: r.issue_type || "Civic Concern",
    description: r.description || "",
    municipality: r.municipalities?.name || "Unknown Municipality",
    barangay: r.barangays?.name || "Unknown Barangay",
    streetAddress: r.location || "N/A",
    landmark: r.landmark || "N/A",
    urgency: r.urgency || "Low",
    status: r.status || "In Review",
    date: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A',
    timeline: Array.isArray(r.report_timeline) ? r.report_timeline : [],
    completedBy: r.completed_by_display || r.completed_by_name || "Assigned Personnel",
    rejectionReason: r.rejection_reason || null,
    reporterPhotos: (r.report_photos || []).filter((p: any) => !p.is_completion_photo).map((p: any) => p.photo_url),
    completionPhotos: (r.report_photos || []).filter((p: any) => p.is_completion_photo).map((p: any) => p.photo_url)
  })) : [];

  // Filter items based on activeTab, search query, and urgency
  const filteredItems = reportsList.filter((item: any) => {
    // Tab filter
    if (activeTab === "in_review") {
      if (item.status !== "In Review" && item.status !== "Pending") return false;
    } else if (activeTab === "action_taken") {
      if (item.status !== "Action Taken" && item.status !== "Delegated" && item.status !== "In Progress") return false;
    } else if (activeTab === "resolved") {
      if (item.status !== "Resolved" && item.status !== "Completed") return false;
    } else if (activeTab === "rejected") {
      if (item.status !== "Rejected") return false;
    }

    // Urgency filter
    if (urgencyFilter !== "All" && (item.urgency || "").toLowerCase() !== urgencyFilter.toLowerCase()) {
      return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchId = (item.id || "").toLowerCase().includes(q);
      const matchTitle = (item.title || "").toLowerCase().includes(q);
      const matchDesc = (item.description || "").toLowerCase().includes(q);
      const matchBarangay = (item.barangay || "").toLowerCase().includes(q);
      const matchMunicipality = (item.municipality || "").toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchDesc && !matchBarangay && !matchMunicipality) {
        return false;
      }
    }

    return true;
  });

  // Count tallies for tabs
  const countAll = reportsList.length;
  const countInReview = reportsList.filter((r: any) => r.status === "In Review" || r.status === "Pending").length;
  const countActionTaken = reportsList.filter((r: any) => r.status === "Action Taken" || r.status === "Delegated" || r.status === "In Progress").length;
  const countResolved = reportsList.filter((r: any) => r.status === "Resolved" || r.status === "Completed").length;
  const countRejected = reportsList.filter((r: any) => r.status === "Rejected").length;

  return (
    <div className="min-h-screen bg-white pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800">
              <Clock3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Report History</h1>
              <p className="text-slate-600 text-sm">Review your submitted reports, tracking IDs, milestones, and completion proofs.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button asChild variant="outline" size="sm" className="rounded-md border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300">
              <Link href="/client/tracking" className="flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" />
                <span>Track By Number</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-3 rounded-md border border-slate-200/80 dark:border-slate-800">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
            <Input
              type="text"
              placeholder="Search reports by title, ID, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-white dark:bg-slate-900 border-slate-200 rounded-md text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Filter className="h-4 w-4 text-slate-600 shrink-0" />
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-slate-900 border-slate-200 rounded-md text-xs sm:text-sm">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 z-50 rounded-md">
                <SelectItem value="All">All Urgency</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto mb-6 bg-transparent border-b rounded-none p-0">
            <TabsTrigger 
              value="all" 
              className="text-[11px] sm:text-xs md:text-sm lg:text-base py-3 px-0.5 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-semibold transition-all duration-300 ease-in-out text-center truncate flex items-center justify-center gap-1"
            >
              <span>All</span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {countAll}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="in_review" 
              className="text-[11px] sm:text-xs md:text-sm lg:text-base py-3 px-0.5 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-semibold transition-all duration-300 ease-in-out text-center truncate flex items-center justify-center gap-1"
            >
              <span>In Review</span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                {countInReview}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="action_taken" 
              className="text-[11px] sm:text-xs md:text-sm lg:text-base py-3 px-0.5 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-semibold transition-all duration-300 ease-in-out text-center truncate flex items-center justify-center gap-1"
            >
              <span>Action</span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                {countActionTaken}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="resolved" 
              className="text-[11px] sm:text-xs md:text-sm lg:text-base py-3 px-0.5 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-700 font-semibold transition-all duration-300 ease-in-out text-center truncate flex items-center justify-center gap-1"
            >
              <span>Resolved</span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                {countResolved}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="rejected" 
              className="text-[11px] sm:text-xs md:text-sm lg:text-base py-3 px-0.5 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-red-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-red-700 font-semibold transition-all duration-300 ease-in-out text-center truncate flex items-center justify-center gap-1"
            >
              <span>Rejected</span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                {countRejected}
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="m-0 focus-visible:outline-none">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {!isMounted || isLoading ? (
                <div className="text-center py-12 col-span-full text-slate-600 bg-slate-50 dark:bg-slate-900 rounded-md border border-dashed border-slate-300 dark:border-slate-800" role="status">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-slate-600 animate-spin" aria-hidden="true" />
                  Loading your report records...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center text-center py-12 px-4 col-span-full bg-slate-50 dark:bg-slate-900 rounded-md border border-dashed border-slate-300 dark:border-slate-800">
                  <FileText className="h-10 w-10 text-slate-600 mb-3" aria-hidden="true" />
                  <p className="text-base font-semibold text-slate-900">{countAll === 0 ? "You haven't submitted any reports yet" : "No reports match this filter"}</p>
                  <p className="text-sm text-slate-600 mt-1">{countAll === 0 ? "Reports you submit will appear here with their tracking IDs." : "Try another tab, urgency, or search term."}</p>
                </div>
              ) : (
                filteredItems.map((item: any) => {
                  const isResolved = item.status === 'Resolved' || item.status === 'Completed';
                  const isRejected = item.status === 'Rejected';
                  const isActionTaken = item.status === 'Action Taken' || item.status === 'Delegated' || item.status === 'In Progress';
                  const isInReview = item.status === 'In Review' || item.status === 'Pending';

                  return (
                    <Card
                      key={item.id}
                      className="group flex flex-col overflow-hidden rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex-1 p-4 sm:p-5">
                        {/* Status first — it's what the reporter checks for */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(item.status)}`}>
                            {item.status}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                            {item.date}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">
                          {item.title}
                        </h3>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                          <span className="capitalize">{item.issueType.replace(/_/g, ' ')}</span>
                          <span aria-hidden="true">·</span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-px text-[11px] font-semibold capitalize ${urgencyBadgeClass(item.urgency)}`}>
                            <AlertCircle className="h-3 w-3" aria-hidden="true" />
                            {item.urgency} urgency
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-start gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                          <span className="min-w-0">
                            {item.barangay}
                            {item.municipality !== "Unknown Municipality" && <span className="text-slate-600 dark:text-slate-400">, {item.municipality}</span>}
                          </span>
                        </div>

                        {item.description && (
                          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        {/* What's happening now — one line, coloured by stage */}
                        <div className={`mt-3 flex items-start gap-2 rounded-md px-3 py-2 text-sm ${
                          isResolved ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : isRejected ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                          : isActionTaken ? 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300'
                          : 'bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
                        }`}>
                          {isResolved ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            : isRejected ? <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            : <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
                          <span className="min-w-0 line-clamp-2">
                            {isResolved ? <>Resolved by <span className="font-semibold">{item.completedBy}</span></>
                              : isRejected ? <><span className="font-semibold">Reason:</span> {item.rejectionReason || 'Spam or invalid details'}</>
                              : isActionTaken ? 'A field team is working on this'
                              : isInReview ? 'Waiting for verification by the local administration'
                              : item.status}
                          </span>
                        </div>
                      </div>

                      {/* Footer: reference info left, action right */}
                      <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 px-4 py-3 sm:px-5">
                        <div className="flex min-w-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleCopyTracking(item.id, e)}
                            className="inline-flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 -ml-1.5 font-mono text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-slate-800"
                            title="Copy tracking ID"
                            aria-label={`Copy tracking ID ${item.id}`}
                          >
                            <span className="truncate">{item.id}</span>
                            {copiedId === item.id ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                          </button>
                          {(item.reporterPhotos.length + item.completionPhotos.length) > 0 && (
                            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-600 dark:text-slate-400" title="Photos">
                              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              {item.reporterPhotos.length + item.completionPhotos.length}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="h-9 shrink-0 gap-1.5 rounded-md bg-primary font-semibold text-white hover:bg-primary-dark"
                          onClick={() => setSelectedReport(item)}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          Details
                        </Button>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Report Details Modal */}
        <Dialog open={Boolean(selectedReport)} onOpenChange={(open) => !open && setSelectedReport(null)}>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-5xl rounded-lg max-h-[88vh] overflow-y-auto p-5 sm:p-7">
            {selectedReport && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedReport.status === 'Resolved' || selectedReport.status === 'Completed' ? (
                      <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" /> Resolved Case Details
                      </span>
                    ) : selectedReport.status === 'Rejected' ? (
                      <span className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <XCircle className="h-5 w-5" /> Rejected Report Details
                      </span>
                    ) : selectedReport.status === 'Action Taken' || selectedReport.status === 'Delegated' ? (
                      <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Clock className="h-5 w-5" /> In-Progress Field Report
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <FileText className="h-5 w-5" /> Report Details
                      </span>
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    Tracking ID: <span className="font-mono font-semibold">{selectedReport.id}</span> • Submitted on {selectedReport.date}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                  {/* Left Column: Details & Timeline */}
                  <div className="space-y-4">
                    <div className="rounded-md bg-slate-50 dark:bg-slate-900 border p-4 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <div className="font-semibold text-base text-slate-900 dark:text-slate-100">{selectedReport.title}</div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${urgencyBadgeClass(selectedReport.urgency)}`}>
                          {selectedReport.urgency} Urgency
                        </span>
                      </div>

                      <div className="text-sm grid gap-2 text-slate-600">
                        <div className="flex justify-between border-b pb-2 gap-4">
                          <span className="text-slate-600">Category:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 text-right capitalize">
                            {selectedReport.issueType?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2 gap-4">
                          <span className="text-slate-600">Location:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 text-right">
                            {selectedReport.barangay}, {selectedReport.municipality}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2 gap-4">
                          <span className="text-slate-600">Street / Site:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 text-right">
                            {selectedReport.streetAddress}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2 gap-4">
                          <span className="text-slate-600">Landmark:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 text-right">
                            {selectedReport.landmark}
                          </span>
                        </div>
                        <div className="grid pb-1 gap-1">
                          <span className="text-slate-600">Description:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-950 p-2.5 rounded border">
                            {selectedReport.description || "No description provided."}
                          </span>
                        </div>
                      </div>

                      {/* Status Specific Info Box */}
                      {selectedReport.status === 'Resolved' && (
                        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md p-3">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Action completed by <span className="font-semibold">{selectedReport.completedBy}</span>. Proof photos are available on the right.</span>
                        </div>
                      )}

                      {selectedReport.status === 'Rejected' && selectedReport.rejectionReason && (
                        <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-md p-3">
                          <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          <span className="leading-snug"><span className="font-semibold">Rejection Reason:</span> {selectedReport.rejectionReason}</span>
                        </div>
                      )}
                    </div>

                    {/* Timeline Milestones */}
                    <div className="rounded-md bg-slate-50 dark:bg-slate-900 border p-4 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Timeline Milestones
                      </h4>
                      {selectedReport.timeline && selectedReport.timeline.length > 0 ? (
                        <div className="space-y-2.5">
                          {selectedReport.timeline.map((entry: any, index: number) => (
                            <div key={index} className="flex items-start gap-2.5 text-xs pb-2 border-b border-slate-200/60 dark:border-slate-800 last:border-0 last:pb-0">
                              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between font-medium text-slate-800 dark:text-slate-200">
                                  <span>{entry.status || entry.action || "Status Update"}</span>
                                  <span className="text-[11px] text-slate-600">
                                    {entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}
                                  </span>
                                </div>
                                {entry.notes && (
                                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">{entry.notes}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 italic">No timeline records logged yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Separate Tabs for Uploaded Photos & Completion Proof */}
                  <div className="space-y-4">
                    <Tabs defaultValue={selectedReport.completionPhotos && selectedReport.completionPhotos.length > 0 ? "completion" : "reporter"} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                        <TabsTrigger 
                          value="reporter" 
                          className="text-xs sm:text-sm font-medium py-1.5 flex items-center justify-center gap-1.5 rounded data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm"
                        >
                          <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Uploaded Photos</span>
                          <span className="ml-1 px-1.5 py-0.2 rounded-sm text-[10px] font-semibold bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                            {selectedReport.reporterPhotos?.length || 0}
                          </span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="completion" 
                          className="text-xs sm:text-sm font-medium py-1.5 flex items-center justify-center gap-1.5 rounded data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Completion Proof</span>
                          <span className="ml-1 px-1.5 py-0.2 rounded-sm text-[10px] font-semibold bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                            {selectedReport.completionPhotos?.length || 0}
                          </span>
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="reporter" className="mt-3 focus-visible:outline-none">
                        <ReportMediaGallery
                          title="Reporter Uploaded Images"
                          images={(selectedReport.reporterPhotos || []).map((url: string, index: number) => ({ url, alt: `Reporter photo ${index + 1}` }))}
                          emptyText="No reporter images uploaded."
                        />
                      </TabsContent>

                      <TabsContent value="completion" className="mt-3 focus-visible:outline-none">
                        <ReportMediaGallery
                          title="Workforce Completion Proof"
                          images={(selectedReport.completionPhotos || []).map((url: string, index: number) => ({ url, alt: `Completion proof ${index + 1}` }))}
                          emptyText="No completion proof has been submitted yet."
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>

                {/* Dialog Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mt-4 pt-3 border-t">
                  <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-10 rounded-md flex items-center justify-center gap-1.5 text-xs text-slate-700 dark:text-slate-300"
                      onClick={() => handleCopyTracking(selectedReport.id)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copiedId === selectedReport.id ? "Copied!" : "Copy Tracking ID"}</span>
                    </Button>
                    <Button 
                      asChild 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-10 rounded-md flex items-center justify-center gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900"
                    >
                      <Link href={`/client/tracking?id=${selectedReport.id}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open Tracking</span>
                      </Link>
                    </Button>
                  </div>

                  <Button 
                    className="w-full sm:w-auto h-10 rounded-md bg-sky-700 hover:bg-sky-800 text-white font-bold"
                    onClick={() => setSelectedReport(null)}
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}
