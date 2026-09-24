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
import Link from "next/link"

export default function ClientHistoryPage() {
  useRealtimeReports({ enableToasts: false, userRole: "client" });
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
    refetchInterval: 10000,
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
              <h1 className="text-3xl font-bold">Report History</h1>
              <p className="text-muted-foreground text-sm">Review your submitted reports, tracking IDs, milestones, and completion proofs.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-md border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300">
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
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search reports by title, ID, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-white dark:bg-slate-900 border-slate-200 rounded-md text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
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
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {countActionTaken}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="resolved" 
              className="text-[11px] sm:text-xs md:text-sm lg:text-base py-3 px-0.5 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-700 font-semibold transition-all duration-300 ease-in-out text-center truncate flex items-center justify-center gap-1"
            >
              <span>Resolved</span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {countResolved}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="rejected" 
              className="text-[11px] sm:text-xs md:text-sm lg:text-base py-3 px-0.5 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-red-600 font-semibold transition-all duration-300 ease-in-out text-center truncate flex items-center justify-center gap-1"
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
                <div className="text-center py-12 col-span-full text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-md border border-dashed border-slate-300 dark:border-slate-800">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-slate-400 animate-spin" />
                  Loading your report records...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12 col-span-full text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-md border border-dashed border-slate-300 dark:border-slate-800">
                  No reports found for this filter.
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
                      className="group relative overflow-hidden rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between"
                    >
                      <div className="p-4 sm:p-5 pb-3">
                        {/* Top Meta Row: Urgency Pill, Category Pill, Report ID */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full capitalize border ${
                              (item.urgency || '').toLowerCase() === 'high'
                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
                                : (item.urgency || '').toLowerCase() === 'medium'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            }`}>
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              {item.urgency || 'Low'}
                            </span>

                            {item.issueType && (
                              <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 capitalize">
                                {item.issueType.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50/70 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800">
                              {item.id}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                              onClick={(e) => handleCopyTracking(item.id, e)}
                              title="Copy tracking ID"
                            >
                              {copiedId === item.id ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </h3>

                        {/* Location & Date */}
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">{item.barangay}</span>
                          {item.municipality && item.municipality !== "Unknown Municipality" && (
                            <span>, {item.municipality}</span>
                          )}
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{item.date}</span>
                        </div>
                      </div>

                      <div className="px-4 sm:px-5 pb-3 space-y-2.5 flex-1 flex flex-col justify-between">
                        {/* Description Preview */}
                        <div>
                          {item.description ? (
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed bg-slate-50/70 dark:bg-slate-900/40 rounded-md p-2.5 border border-slate-100 dark:border-slate-800/80">
                              {item.description}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 italic bg-slate-50/70 dark:bg-slate-900/40 rounded-md p-2 border border-slate-100 dark:border-slate-800/80">
                              No description provided.
                            </p>
                          )}

                          {/* Photos Badge Indicator */}
                          {((item.reporterPhotos && item.reporterPhotos.length > 0) || (item.completionPhotos && item.completionPhotos.length > 0)) && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1.5">
                              {item.reporterPhotos && item.reporterPhotos.length > 0 && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full text-[11px] font-medium">
                                  <ImageIcon className="h-3 w-3 text-slate-500" />
                                  {item.reporterPhotos.length} photo{item.reporterPhotos.length > 1 ? 's' : ''}
                                </span>
                              )}
                              {item.completionPhotos && item.completionPhotos.length > 0 && (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-full text-[11px] font-medium">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  {item.completionPhotos.length} proof photo{item.completionPhotos.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Tab-Specific Context Callout Banner */}
                        <div className="pt-1">
                          {isResolved && (
                            <div className="flex items-center justify-between text-xs bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-md p-2.5 text-emerald-800 dark:text-emerald-300">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span className="truncate">
                                  Resolved by <span className="font-semibold">{item.completedBy}</span>
                                </span>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/70 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded-full text-emerald-800 dark:text-emerald-200 shrink-0 ml-2">
                                Resolved
                              </span>
                            </div>
                          )}

                          {isRejected && (
                            <div className="flex items-start gap-2 text-xs bg-red-50/90 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 rounded-md p-2.5 text-red-700 dark:text-red-300">
                              <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-red-800 dark:text-red-200">Rejection Reason: </span>
                                <span className="text-red-700 dark:text-red-300 leading-snug">{item.rejectionReason || 'Spam or invalid details'}</span>
                              </div>
                            </div>
                          )}

                          {isActionTaken && (
                            <div className="flex items-center justify-between text-xs bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-md p-2.5 text-blue-800 dark:text-blue-300">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Clock className="h-4 w-4 text-blue-600 shrink-0 animate-pulse" />
                                <span className="truncate font-medium">In Progress with Assigned Workforce</span>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200 px-1.5 py-0.5 rounded-full shrink-0 ml-2">
                                Active
                              </span>
                            </div>
                          )}

                          {isInReview && (
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 rounded-md p-2 border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-1.5 truncate">
                                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">Under verification by Local Administration</span>
                              </div>
                              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/60 px-1.5 py-0.5 rounded-full shrink-0 ml-2">
                                In Review
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Action Button Footer */}
                      <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                        <Button 
                          size="sm" 
                          className={`w-full font-semibold text-white shadow-sm transition-all flex items-center justify-center gap-2 h-9 rounded-md ${
                            isResolved 
                              ? 'bg-emerald-600 hover:bg-emerald-700' 
                              : isActionTaken
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : isRejected
                                  ? 'bg-slate-700 hover:bg-slate-800'
                                  : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          onClick={() => setSelectedReport(item)}
                        >
                          {isResolved ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-white" />
                              <span>View Resolution &amp; Proof</span>
                            </>
                          ) : isRejected ? (
                            <>
                              <FileText className="h-4 w-4 text-white" />
                              <span>View Rejection Details</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 text-white" />
                              <span>View Full Details</span>
                            </>
                          )}
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
                      <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" /> Resolved Case Details
                      </span>
                    ) : selectedReport.status === 'Rejected' ? (
                      <span className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <XCircle className="h-5 w-5" /> Rejected Report Details
                      </span>
                    ) : selectedReport.status === 'Action Taken' || selectedReport.status === 'Delegated' ? (
                      <span className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
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
                        <div className="font-bold text-base text-slate-900 dark:text-slate-100">{selectedReport.title}</div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${
                          (selectedReport.urgency || '').toLowerCase() === 'high'
                            ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800'
                            : (selectedReport.urgency || '').toLowerCase() === 'medium'
                              ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800'
                              : 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800'
                        }`}>
                          {selectedReport.urgency} Urgency
                        </span>
                      </div>

                      <div className="text-sm grid gap-2 text-muted-foreground">
                        <div className="flex justify-between border-b pb-2 gap-4">
                          <span className="text-slate-500">Category:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 text-right capitalize">
                            {selectedReport.issueType?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2 gap-4">
                          <span className="text-slate-500">Location:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 text-right">
                            {selectedReport.barangay}, {selectedReport.municipality}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2 gap-4">
                          <span className="text-slate-500">Street / Site:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 text-right">
                            {selectedReport.streetAddress}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2 gap-4">
                          <span className="text-slate-500">Landmark:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 text-right">
                            {selectedReport.landmark}
                          </span>
                        </div>
                        <div className="grid pb-1 gap-1">
                          <span className="text-slate-500">Description:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-950 p-2.5 rounded border">
                            {selectedReport.description || "No description provided."}
                          </span>
                        </div>
                      </div>

                      {/* Status Specific Info Box */}
                      {selectedReport.status === 'Resolved' && (
                        <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md p-3">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Action completed by <span className="font-semibold">{selectedReport.completedBy}</span>. Proof photos are available on the right.</span>
                        </div>
                      )}

                      {selectedReport.status === 'Rejected' && selectedReport.rejectionReason && (
                        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-md p-3">
                          <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          <span className="leading-snug"><span className="font-semibold">Rejection Reason:</span> {selectedReport.rejectionReason}</span>
                        </div>
                      )}
                    </div>

                    {/* Timeline Milestones */}
                    <div className="rounded-md bg-slate-50 dark:bg-slate-900 border p-4 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Timeline Milestones
                      </h4>
                      {selectedReport.timeline && selectedReport.timeline.length > 0 ? (
                        <div className="space-y-2.5">
                          {selectedReport.timeline.map((entry: any, index: number) => (
                            <div key={index} className="flex items-start gap-2.5 text-xs pb-2 border-b border-slate-200/60 dark:border-slate-800 last:border-0 last:pb-0">
                              <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between font-medium text-slate-800 dark:text-slate-200">
                                  <span>{entry.status || entry.action || "Status Update"}</span>
                                  <span className="text-[11px] text-slate-400">
                                    {entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}
                                  </span>
                                </div>
                                {entry.notes && (
                                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">{entry.notes}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No timeline records logged yet.</p>
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
                          <span className="ml-1 px-1.5 py-0.2 rounded-sm text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {selectedReport.reporterPhotos?.length || 0}
                          </span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="completion" 
                          className="text-xs sm:text-sm font-medium py-1.5 flex items-center justify-center gap-1.5 rounded data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Completion Proof</span>
                          <span className="ml-1 px-1.5 py-0.2 rounded-sm text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="rounded-md flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300"
                      onClick={() => handleCopyTracking(selectedReport.id)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copiedId === selectedReport.id ? "Copied!" : "Copy Tracking ID"}</span>
                    </Button>
                    <Button 
                      asChild 
                      variant="outline" 
                      size="sm" 
                      className="rounded-md flex items-center gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900"
                    >
                      <Link href={`/client/tracking?id=${selectedReport.id}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open Tracking Page</span>
                      </Link>
                    </Button>
                  </div>

                  <Button 
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs sm:text-sm"
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
