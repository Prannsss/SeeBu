"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  FileWarning, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Filter, 
  Eye, 
  Camera, 
  Clock, 
  XCircle, 
  Calendar, 
  Image as ImageIcon, 
  User 
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { gooeyToast } from "goey-toast"
import { Textarea } from "@/components/ui/textarea"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ReportMediaGallery } from "@/components/reports/report-media-gallery"
import { useCurrentUser } from "@/hooks/queries/useCurrentUser"
import { useRealtimeReports } from "@/hooks/useRealtimeReports"

export default function AdminReportsPage() {
  useRealtimeReports({ enableToasts: true, userRole: "admin" });
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("In Review");
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  const [delegationOpen, setDelegationOpen] = useState<string | null>(null);    
  const [reviewOpen, setReviewOpen] = useState<string | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [delegateMode, setDelegateMode] = useState(false);
  const [rejectReasonType, setRejectReasonType] = useState("");
  const [rejectReasonOther, setRejectReasonOther] = useState("");
  const [resolvedOpen, setResolvedOpen] = useState<string | null>(null);
  const [delegateDepartmentId, setDelegateDepartmentId] = useState("");
  const [delegateAssignee, setDelegateAssignee] = useState("");

  const maskName = (name: string) => {
    if (!name || name === "Anonymous Reporter" || name === "N/A") return name;
    return name.split(" ").map((part) => {
      if (part.length <= 2) return part;
      return part[0] + "*".repeat(part.length - 2) + part[part.length - 1];
    }).join(" ");
  };

  const maskEmail = (email: string) => {
    if (!email || email === "Hidden (Anonymous)" || email === "N/A") return email;
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const maskedLocal = local.length <= 2 ? "*".repeat(local.length) : local[0] + local[1] + "*".repeat(local.length - 2);
    return `${maskedLocal}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone === "Hidden (Anonymous)" || phone === "N/A") return phone;
    if (phone.length <= 4) return phone;
    const visible = phone.slice(-4);
    const prefix = phone.slice(0, phone.length - 7);
    return `${prefix}${'*'.repeat(phone.length - prefix.length - 4)}${visible}`;
  };

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['admin-reports', currentUser?.municipality_id],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      const municipalityId: string | undefined = currentUser?.municipality_id || undefined;
      const json = municipalityId
        ? await apiClient.reports.getAll({ municipality_id: municipalityId })
        : await apiClient.reports.getAll();
      return json.data;
    },
    refetchInterval: 10000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (payload: { id: string, status: string, notes?: string, rejection_reason?: string, delegated_to?: string, assigned_to?: string, assigned_role?: string }) => {
      const { apiClient } = await import('@/lib/api');
      const res = await apiClient.reports.update(payload.id, {
        status: payload.status,
        notes: payload.notes,
        rejection_reason: payload.rejection_reason,
        delegated_to: payload.delegated_to,
        assigned_to: payload.assigned_to,
        assigned_role: payload.assigned_role,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    }
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['delegation-departments'],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      const json = await apiClient.departments.getAll({ include_personnel: true });
      return json.data || [];
    }
  });

  const departments = Array.isArray(departmentsData) ? departmentsData : [];
  const selectedDepartment = departments.find((department: any) => String(department.id) === delegateDepartmentId);
  const selectedDepartmentPersonnel = Array.isArray(selectedDepartment?.personnel)
    ? selectedDepartment.personnel
    : [];

  const parseAssigneeValue = (value: string) => {
    const [role, id] = value.split(':');
    if (!role || !id) return null;
    return { role, id };
  };

  const handleApprove = (id: string) => {
    if (!delegateDepartmentId) {
      gooeyToast.error("Error", { description: "Please choose a department before approving." });
      return;
    }

    if (!delegateAssignee) {
      gooeyToast.error("Please choose an assignee before approving.");
      return;
    }

    const assignee = parseAssigneeValue(delegateAssignee);
    if (!assignee) {
      gooeyToast.error("Invalid assignee selection.");
      return;
    }

    updateStatusMutation.mutate({
      id,
      status: 'Action Taken',
      delegated_to: delegateDepartmentId,
      assigned_to: assignee.id,
      assigned_role: assignee.role,
      notes: `Report approved and delegated to ${selectedDepartment?.name || `department ${delegateDepartmentId}`}.`
    }, {
      onSuccess: () => {
        gooeyToast.success(`Report approved and delegated.`);
        setReviewOpen(null);
        setDelegateDepartmentId("");
        setDelegateAssignee("");
      },
      onError: (err) => {
        gooeyToast.error(err?.message?.trim() || "Failed to approve and delegate report.");
      }
    });
  }

  const handleReject = (id: string) => {
    const actualReason = rejectReasonType === "Other"
      ? rejectReasonOther.trim()
      : rejectReasonType;
    if (!actualReason) {
      gooeyToast.error("Please select a reason for rejection.");
      return;
    }
    updateStatusMutation.mutate({ id, status: 'Rejected', notes: 'Report rejected.', rejection_reason: actualReason }, {
      onSuccess: () => {
        gooeyToast.success(`Report rejected.`);       
        setRejectMode(false);
        setRejectReasonType("");
        setRejectReasonOther("");
        setReviewOpen(null);
      },
      onError: (err) => {
        gooeyToast.error(err?.message?.trim() || "Failed to reject report.");
      }
    });
  }

  const handleDelegate = (id: string) => {
    if (!delegateDepartmentId || !delegateAssignee) return;

    const assignee = parseAssigneeValue(delegateAssignee);
    if (!assignee) {
      gooeyToast.error("Invalid assignee selection.");
      return;
    }

    updateStatusMutation.mutate({
      id,
      status: 'Delegated',
      notes: `Delegated to department ${delegateDepartmentId}`,
      delegated_to: delegateDepartmentId,
      assigned_to: assignee.id,
      assigned_role: assignee.role,
    }, {
      onSuccess: () => {
        gooeyToast.success(`Report delegated successfully.`);
        setDelegationOpen(null);
        setDelegateDepartmentId("");
        setDelegateAssignee("");
      },
      onError: (err) => {
        gooeyToast.error(err?.message?.trim() || "Failed to delegate report.");
      }
    });
  }

  const reportsList = Array.isArray(reportsData) ? reportsData.map(r => ({
    id: r.id,
    title: r.title,
    issueType: r.issue_type,
    description: r.description,
    municipality: r.municipalities?.name || "Unknown",
    zone: r.barangays?.name || "Unknown",
    barangay: r.barangays?.name || "Unknown",
    streetAddress: r.location || "N/A",
    landmark: r.landmark || "N/A",
    urgency: r.urgency,
    status: r.status,
    date: new Date(r.created_at).toLocaleDateString(),
    reporterName: r.is_anonymous ? "Anonymous Reporter" : (r.reporter_name || "N/A"),
    reporterEmail: r.is_anonymous ? "Hidden (Anonymous)" : (r.reporter_email || "N/A"),
    reporterPhone: r.is_anonymous ? "Hidden (Anonymous)" : (r.reporter_phone || "N/A"),
    timeline: r.report_timeline?.[0]?.notes || 'No timeline records.',
    completedBy: r.completed_by_display || r.completed_by_name || "Assigned personnel",
    rejectionReason: r.rejection_reason,
    reporterPhotos: (r.report_photos || []).filter((p: any) => !p.is_completion_photo).map((p: any) => p.photo_url),
    completionPhotos: (r.report_photos || []).filter((p: any) => p.is_completion_photo).map((p: any) => p.photo_url)
  })) : [];

  const filteredItems = reportsList.filter((item: any) => {
    const matchesTab = item.status === activeTab;
    const matchesUrgency = urgencyFilter === "All" || (item.urgency || "").toLowerCase() === urgencyFilter.toLowerCase();
    return matchesTab && matchesUrgency;
  });

  return (
    <div className="min-h-screen bg-white pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileWarning className="h-7 w-7 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Reports</h1>
              <p className="text-muted-foreground">Prioritize reports by urgency and location impact.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 z-10 relative">
            <Filter className="h-5 w-5 text-slate-500" />
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[140px] bg-white dark:bg-slate-900 border-slate-200 shadow-sm">
                <SelectValue placeholder="Filter Urgency" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 z-50">
                <SelectItem value="All">All Urgency</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="In Review" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto mb-6 bg-transparent border-b rounded-none p-0">
            <TabsTrigger
              value="In Review"
              className="text-xs sm:text-sm md:text-base py-3 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-semibold transition-all duration-300 ease-in-out text-center truncate"
            >
              In Review
            </TabsTrigger>
            <TabsTrigger
              value="Action Taken"
              className="text-xs sm:text-sm md:text-base py-3 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-semibold transition-all duration-300 ease-in-out text-center truncate"
            >
              Action Taken
            </TabsTrigger>
            <TabsTrigger
              value="Resolved"
              className="text-xs sm:text-sm md:text-base py-3 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-700 font-semibold transition-all duration-300 ease-in-out text-center truncate"
            >
              Resolved
            </TabsTrigger>
            <TabsTrigger
              value="Rejected"
              className="text-xs sm:text-sm md:text-base py-3 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-red-600 font-semibold transition-all duration-300 ease-in-out text-center truncate"
            >
              Rejected
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0 focus-visible:outline-none">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 col-span-full text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-md border border-dashed border-slate-300 dark:border-slate-800">
                  No records found for this category and urgency.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <Dialog
                    key={item.id}
                    open={delegationOpen === item.id}
                    onOpenChange={(open) => {
                      setDelegationOpen(open ? item.id : null);
                      if (!open) {
                        setDelegateDepartmentId("");
                        setDelegateAssignee("");
                      }
                    }}
                  >
                    <Card className="group relative overflow-hidden rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between">
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

                          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50/70 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800 shrink-0">
                            {item.id}
                          </span>
                        </div>

                        {/* Card Title */}
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </h3>

                        {/* Location & Date */}
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">{item.barangay}</span>
                          {item.municipality && item.municipality !== "Unknown" && (
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
                                  {item.completionPhotos.length} proof
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Tab-Specific Context Callout Banner */}
                        <div className="pt-1">
                          {item.status === 'Resolved' && (
                            <div className="flex items-center justify-between text-xs bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-md p-2.5 text-emerald-800 dark:text-emerald-300">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span className="truncate">
                                  Completed by <span className="font-semibold">{item.completedBy}</span>
                                </span>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/70 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded-full text-emerald-800 dark:text-emerald-200 shrink-0 ml-2">
                                Resolved
                              </span>
                            </div>
                          )}

                          {item.status === 'Rejected' && (
                            <div className="flex items-start gap-2 text-xs bg-red-50/90 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 rounded-md p-2.5 text-red-700 dark:text-red-300">
                              <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-red-800 dark:text-red-200">Rejection Reason: </span>
                                <span className="text-red-700 dark:text-red-300 leading-snug">{item.rejectionReason || 'Spam or invalid details'}</span>
                              </div>
                            </div>
                          )}

                          {item.status === 'Action Taken' && (
                            <div className="flex items-center justify-between text-xs bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-md p-2.5 text-blue-800 dark:text-blue-300">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Clock className="h-4 w-4 text-blue-600 shrink-0 animate-pulse" />
                                <span className="truncate font-medium">In Progress with Workforce</span>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200 px-1.5 py-0.5 rounded-full shrink-0 ml-2">
                                Active
                              </span>
                            </div>
                          )}

                          {item.status === 'In Review' && (
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 rounded-md p-2 border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-1.5 truncate">
                                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">Reporter: <span className="font-medium text-slate-700 dark:text-slate-300">{maskName(item.reporterName)}</span></span>
                              </div>
                              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/60 px-1.5 py-0.5 rounded-full shrink-0 ml-2">
                                Needs Action
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Action Button Footer */}
                      <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                        {item.status === 'In Review' && (
                          <Button 
                            size="sm" 
                            className="w-full font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center gap-2 h-9 rounded-md"
                            onClick={() => {
                              setReviewOpen(item.id)
                              setRejectMode(false)
                              setDelegateMode(false)
                              setRejectReasonType("")
                              setRejectReasonOther("")
                              setDelegateDepartmentId("")
                              setDelegateAssignee("")
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            <span>Review &amp; Delegate</span>
                          </Button>
                        )}

                        {item.status === 'Resolved' && (
                          <Button 
                            size="sm" 
                            className="w-full font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all flex items-center justify-center gap-2 h-9 rounded-md"
                            onClick={() => setResolvedOpen(item.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 text-white" />
                            <span>View Details &amp; Proof</span>
                          </Button>
                        )}

                        {item.status === 'Action Taken' && (
                          <Button 
                            size="sm" 
                            className="w-full font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center gap-2 h-9 rounded-md"
                            onClick={() => setResolvedOpen(item.id)}
                          >
                            <Clock className="h-4 w-4 text-white" />
                            <span>View Progress &amp; Details</span>
                          </Button>
                        )}

                        {item.status === 'Rejected' && (
                          <Button 
                            size="sm" 
                            className="w-full font-semibold text-white bg-slate-700 hover:bg-slate-800 shadow-sm transition-all flex items-center justify-center gap-2 h-9 rounded-md"
                            onClick={() => setResolvedOpen(item.id)}
                          >
                            <FileText className="h-4 w-4 text-white" />
                            <span>View Report Details</span>
                          </Button>
                        )}

                        {(item.status !== 'Resolved' && item.status !== 'In Review' && item.status !== 'Action Taken' && item.status !== 'Rejected') && (
                          <DialogTrigger asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-md">
                            <Button size="sm" className="w-full font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md">Delegate Task</Button>
                          </DialogTrigger>
                        )}
                      </div>
                    </Card>

                    {/* Review Dialog */}
                    <Dialog open={reviewOpen === item.id} onOpenChange={(open) => {
                      if (!open) {
                        setReviewOpen(null);
                        setRejectMode(false);
                        setDelegateMode(false);
                        setRejectReasonType("");
                        setRejectReasonOther("");
                        setDelegateDepartmentId("");
                        setDelegateAssignee("");
                      }
                    }}>
                      <DialogContent className={`w-[calc(100%-2rem)] ${rejectMode || delegateMode ? 'sm:max-w-xl' : 'sm:max-w-5xl'} rounded-lg max-h-[88vh] overflow-y-auto p-5 sm:p-7 transition-all duration-200`}>
                        <DialogHeader>
                          <DialogTitle>
                            {rejectMode ? "Reject Report" : delegateMode ? "Approve & Delegate Report" : "Review Report"}
                          </DialogTitle>
                          <DialogDescription>
                            {rejectMode 
                              ? `Specify the reason for rejecting report ${item.id}.` 
                              : delegateMode 
                              ? `Select the department and workforce admin to delegate report ${item.id}.` 
                              : "Assess the report details below before taking action."}
                          </DialogDescription>
                        </DialogHeader>
                        
                        {rejectMode ? (
                          <div className="py-4 space-y-4 animate-in fade-in duration-200">
                            {/* Compact Report Summary Banner */}
                            <div className="rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                                  {item.id}
                                </span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${
                                  (item.urgency || '').toLowerCase() === 'high'
                                    ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800'
                                    : (item.urgency || '').toLowerCase() === 'medium'
                                      ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800'
                                      : 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800'
                                }`}>
                                  {item.urgency || 'Low'} Urgency
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {item.title}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 truncate">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span>{item.barangay}, {item.municipality}</span>
                              </div>
                            </div>

                            <div className="space-y-3 rounded-md border border-red-200 bg-red-50/50 dark:bg-red-950/20 p-4">
                              <label className="text-sm font-medium text-red-600 flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4"/> Reason for Rejection *
                              </label>
                              <Select value={rejectReasonType} onValueChange={(v) => { setRejectReasonType(v); setRejectReasonOther(""); }}>
                                <SelectTrigger className="bg-white dark:bg-slate-900 border-red-200 focus:ring-red-500">
                                  <SelectValue placeholder="Select a reason..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-900 z-[100]">
                                  <SelectItem value="Spam report">Spam report</SelectItem>
                                  <SelectItem value="Duplicate report">Duplicate report</SelectItem>
                                  <SelectItem value="Insufficient report details">Insufficient report details</SelectItem>
                                  <SelectItem value="No Uploaded Image">No Uploaded Image</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              {rejectReasonType === "Other" && (
                                <Textarea
                                  placeholder="Describe the reason for rejection..."
                                  value={rejectReasonOther}
                                  onChange={(e) => setRejectReasonOther(e.target.value)}
                                  className="min-h-[90px] border-red-200 focus-visible:ring-red-500 bg-white dark:bg-slate-900 animate-in fade-in duration-150"
                                />
                              )}
                            </div>
                          </div>
                        ) : delegateMode ? (
                          <div className="py-4 space-y-4 animate-in fade-in duration-200">
                            {/* Compact Report Summary Banner */}
                            <div className="rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                                  {item.id}
                                </span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${
                                  (item.urgency || '').toLowerCase() === 'high'
                                    ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800'
                                    : (item.urgency || '').toLowerCase() === 'medium'
                                      ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800'
                                      : 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800'
                                }`}>
                                  {item.urgency || 'Low'} Urgency
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {item.title}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 truncate">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span>{item.barangay}, {item.municipality}</span>
                              </div>
                            </div>

                            <div className="space-y-4 rounded-md border border-blue-200 bg-blue-50/60 dark:bg-blue-950/30 p-4">
                              <div className="space-y-2">
                                <label htmlFor="approve-department" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  Delegate To Department *
                                </label>
                                <Select value={delegateDepartmentId} onValueChange={(value) => {
                                  setDelegateDepartmentId(value);
                                  setDelegateAssignee("");
                                }}>
                                  <SelectTrigger id="approve-department" className="bg-white dark:bg-slate-900 border-slate-200">
                                    <SelectValue placeholder="Select department for task action" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white dark:bg-slate-900 z-[100]">
                                    {departments.map((department: any) => (
                                      <SelectItem key={department.id} value={String(department.id)}>{department.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <label htmlFor="approve-assignee" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  Assign To Workforce Admin *
                                </label>
                                <Select value={delegateAssignee} onValueChange={setDelegateAssignee} disabled={!delegateDepartmentId}>
                                  <SelectTrigger id="approve-assignee" className="bg-white dark:bg-slate-900 border-slate-200">
                                    <SelectValue placeholder={delegateDepartmentId ? "Select assignee" : "Select department first"} />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white dark:bg-slate-900 z-[100]">
                                    {selectedDepartmentPersonnel
                                      .filter((person: any) => person.role === 'workforce-admin')
                                      .map((person: any) => (
                                        <SelectItem key={`${person.role}-${person.id}`} value={`${person.role}:${person.id}`}>
                                          {person.full_name} (Workforce Admin)
                                        </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                            <div className="space-y-4">
                              <div className="rounded-md bg-slate-50 dark:bg-slate-900 border p-4 h-fit">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="font-semibold text-base text-slate-900 dark:text-slate-100">Review Report Details</div>
                                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">{item.id}</span>
                                </div>
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Reporter Details</h4>
                                    <div className="text-sm text-muted-foreground mt-2 grid gap-2">
                                      <div className="flex justify-between border-b pb-2 gap-4">
                                        <span className="text-slate-500">Name:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 text-right font-mono tracking-wide">{maskName(item.reporterName)}</span>
                                      </div>
                                      <div className="flex justify-between border-b pb-2 gap-4">
                                        <span className="text-slate-500">Email:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 text-right break-all font-mono tracking-wide">{maskEmail(item.reporterEmail)}</span>
                                      </div>
                                      <div className="flex justify-between pb-1 gap-4">
                                        <span className="text-slate-500">Contact Number:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 text-right font-mono tracking-wide">{maskPhone(item.reporterPhone)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Report Details</h4>
                                    <div className="text-sm text-muted-foreground mt-2 grid gap-2">
                                      <div className="flex justify-between border-b pb-2 gap-4">
                                        <span className="text-slate-500">Urgency Level:</span>
                                        <span className={`font-medium text-right capitalize ${
                                          (item.urgency || '').toLowerCase() === 'high'
                                            ? 'text-red-600 dark:text-red-400'
                                            : (item.urgency || '').toLowerCase() === 'medium'
                                              ? 'text-amber-600 dark:text-amber-400'
                                              : 'text-emerald-600 dark:text-emerald-400'
                                        }`}>{item.urgency || 'Low'}</span>
                                      </div>
                                      <div className="flex justify-between border-b pb-2 gap-4">
                                        <span className="text-slate-500">Title:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{item.title}</span>
                                      </div>
                                      <div className="grid border-b pb-2 gap-1">
                                        <span className="text-slate-500">Description:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{item.description}</span>
                                      </div>
                                      <div className="flex justify-between border-b pb-2 gap-4">
                                        <span className="text-slate-500">Municipality/City:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{item.municipality}</span>
                                      </div>
                                      <div className="flex justify-between border-b pb-2 gap-4">
                                        <span className="text-slate-500">Barangay:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{item.barangay}</span>
                                      </div>
                                      <div className="grid border-b pb-2 gap-1">
                                        <span className="text-slate-500">Street Address:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.streetAddress}</span>
                                      </div>
                                      <div className="grid pb-1 gap-1">
                                        <span className="text-slate-500">Landmark:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.landmark}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <ReportMediaGallery
                                title="Reporter Uploaded Images"
                                images={(item.reporterPhotos || []).map((url: string, index: number) => ({
                                  url,
                                  alt: `${item.title} reporter image ${index + 1}`
                                }))}
                                emptyText="No reporter images available for this report yet."
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2">
                          {rejectMode ? (
                            <>
                              <Button 
                                type="button"
                                variant="outline"
                                className="w-full" 
                                onClick={() => { 
                                  setRejectMode(false); 
                                  setRejectReasonType("");
                                  setRejectReasonOther("");
                                }}
                              >
                                Back
                              </Button>
                              <Button 
                                type="button"
                                className="w-full bg-red-600 hover:bg-red-700 text-white" 
                                onClick={() => handleReject(item.id)} 
                                disabled={updateStatusMutation.isPending}
                              >
                                {updateStatusMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                              </Button>
                            </>
                          ) : delegateMode ? (
                            <>
                              <Button 
                                type="button"
                                variant="outline"
                                className="w-full" 
                                onClick={() => { 
                                  setDelegateMode(false); 
                                  setDelegateDepartmentId(""); 
                                  setDelegateAssignee(""); 
                                }}
                              >
                                Back
                              </Button>
                              <Button 
                                type="button"
                                onClick={() => handleApprove(item.id)} 
                                disabled={!delegateDepartmentId || !delegateAssignee || updateStatusMutation.isPending}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {updateStatusMutation.isPending ? "Delegating..." : "Confirm & Delegate"}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                type="button"
                                onClick={() => { setRejectMode(true); setDelegateMode(false); }} 
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                              >
                                Reject
                              </Button>
                              <Button 
                                type="button"
                                onClick={() => { setDelegateMode(true); setRejectMode(false); }} 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Approve &amp; Delegate
                              </Button>
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Details Dialog */}
                    <Dialog open={resolvedOpen === item.id} onOpenChange={(open) => { if (!open) setResolvedOpen(null); }}>
                      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-5xl rounded-lg max-h-[88vh] overflow-y-auto p-5 sm:p-7">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {item.status === 'Resolved' ? (
                              <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="h-5 w-5" /> Resolved Report Details
                              </span>
                            ) : item.status === 'Action Taken' ? (
                              <span className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                <Clock className="h-5 w-5" /> In-Progress Report Details
                              </span>
                            ) : item.status === 'Rejected' ? (
                              <span className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                <XCircle className="h-5 w-5" /> Rejected Report Details
                              </span>
                            ) : (
                              <span className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                <FileText className="h-5 w-5" /> Report Details
                              </span>
                            )}
                          </DialogTitle>
                          <DialogDescription>
                            {item.status === 'Resolved' 
                              ? "Full report details and completion proof submitted by workforce."
                              : item.status === 'Action Taken'
                                ? "Report details, assigned personnel, and timeline progress."
                                : item.status === 'Rejected'
                                  ? "Report information and reason for administrative rejection."
                                  : "Comprehensive view of the submitted citizen report."
                            }
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                          <div className="space-y-4">
                            <div className="rounded-md bg-slate-50 dark:bg-slate-900 border p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="font-semibold text-base text-slate-900 dark:text-slate-100">{item.title}</div>
                                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">{item.id}</span>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Reporter</h4>
                                  <div className="text-sm text-muted-foreground grid gap-2">
                                    <div className="flex justify-between border-b pb-2 gap-4">
                                      <span className="text-slate-500">Name:</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right font-mono tracking-wide">{maskName(item.reporterName)}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2 gap-4">
                                      <span className="text-slate-500">Email:</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right break-all font-mono tracking-wide">{maskEmail(item.reporterEmail)}</span>
                                    </div>
                                    <div className="flex justify-between pb-1 gap-4">
                                      <span className="text-slate-500">Phone:</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right font-mono tracking-wide">{maskPhone(item.reporterPhone)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Report Details</h4>
                                  <div className="text-sm text-muted-foreground grid gap-2">
                                    <div className="flex justify-between border-b pb-2 gap-4">
                                      <span className="text-slate-500">Urgency:</span>
                                      <span className={`font-medium text-right capitalize ${
                                        (item.urgency || '').toLowerCase() === 'high'
                                          ? 'text-red-600 dark:text-red-400'
                                          : (item.urgency || '').toLowerCase() === 'medium'
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-emerald-600 dark:text-emerald-400'
                                      }`}>{item.urgency || 'Low'}</span>
                                    </div>
                                    <div className="grid border-b pb-2 gap-1">
                                      <span className="text-slate-500">Description:</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{item.description}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2 gap-4">
                                      <span className="text-slate-500">Barangay:</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{item.barangay}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2 gap-4">
                                      <span className="text-slate-500">Street:</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{item.streetAddress}</span>
                                    </div>
                                    <div className="flex justify-between pb-1 gap-4">
                                      <span className="text-slate-500">Landmark:</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{item.landmark}</span>
                                    </div>
                                  </div>
                                </div>
                                {item.status === 'Resolved' && item.completedBy && (
                                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md p-3">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    <span>Completed by: <span className="font-semibold">{item.completedBy}</span></span>
                                  </div>
                                )}
                                {item.status === 'Rejected' && item.rejectionReason && (
                                  <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-md p-3">
                                    <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span className="leading-snug"><span className="font-semibold">Reason:</span> {item.rejectionReason}</span>
                                  </div>
                                )}
                                {item.status === 'Action Taken' && (
                                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                                    <Clock className="h-4 w-4 shrink-0" />
                                    <span>Status: <span className="font-semibold">In Progress with Workforce</span></span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <Tabs defaultValue={item.completionPhotos && item.completionPhotos.length > 0 ? "completion" : "reporter"} className="w-full">
                              <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                                <TabsTrigger 
                                  value="reporter" 
                                  className="text-xs sm:text-sm font-medium py-1.5 flex items-center justify-center gap-1.5 rounded data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm"
                                >
                                  <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  <span>Uploaded Photos</span>
                                  <span className="ml-1 px-1.5 py-0.2 rounded-sm text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                    {item.reporterPhotos?.length || 0}
                                  </span>
                                </TabsTrigger>
                                <TabsTrigger 
                                  value="completion" 
                                  className="text-xs sm:text-sm font-medium py-1.5 flex items-center justify-center gap-1.5 rounded data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Completion Proof</span>
                                  <span className="ml-1 px-1.5 py-0.2 rounded-sm text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    {item.completionPhotos?.length || 0}
                                  </span>
                                </TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="reporter" className="mt-3 focus-visible:outline-none">
                                <ReportMediaGallery
                                  title="Reporter Uploaded Images"
                                  images={(item.reporterPhotos || []).map((url: string, index: number) => ({ url, alt: `Reporter image ${index + 1}` }))}
                                  emptyText="No reporter images available."
                                />
                              </TabsContent>

                              <TabsContent value="completion" className="mt-3 focus-visible:outline-none">
                                <ReportMediaGallery
                                  title="Completion Proof"
                                  images={(item.completionPhotos || []).map((url: string, index: number) => ({ url, alt: `Proof image ${index + 1}` }))}
                                  emptyText="No completion proof submitted yet."
                                />
                              </TabsContent>
                            </Tabs>
                          </div>
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button className="bg-slate-600 hover:bg-slate-700 text-white rounded-md" onClick={() => setResolvedOpen(null)}>Close</Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Delegation Dialog */}
                    <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md rounded-lg">
                      <DialogHeader>
                        <DialogTitle>Delegate Task</DialogTitle>
                        <DialogDescription>
                          Assign this task to a workforce member or department.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="grid gap-4 py-4">
                        <div className="rounded-md bg-slate-50 dark:bg-slate-900 border p-3">
                          <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{item.title}</div>
                          <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.zone}</span>
                            <span className="flex items-center gap-1 capitalize"><AlertCircle className="h-3 w-3" /> {item.urgency || 'Low'}</span>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <label htmlFor="workforce-department-select" className="text-sm font-medium">Select Department</label>
                          <Select value={delegateDepartmentId} onValueChange={(value) => {
                            setDelegateDepartmentId(value)
                            setDelegateAssignee("")
                          }}>
                            <SelectTrigger id="workforce-department-select" className="bg-white dark:bg-slate-900 border-slate-200">
                              <SelectValue placeholder="Choose department..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 z-[100]">
                              {departments.map((department: any) => (
                                <SelectItem key={department.id} value={String(department.id)}>{department.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <label htmlFor="workforce-select" className="text-sm font-medium">Select Workforce Admin / Officer</label>
                          <Select value={delegateAssignee} onValueChange={setDelegateAssignee} disabled={!delegateDepartmentId}>
                            <SelectTrigger id="workforce-select" className="bg-white dark:bg-slate-900 border-slate-200">
                              <SelectValue placeholder={delegateDepartmentId ? "Choose personnel..." : "Choose department first"} />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 z-[100]">
                              {selectedDepartmentPersonnel
                                .filter((person: any) => person.role === 'workforce-admin')
                                .map((person: any) => (
                                  <SelectItem key={`${person.role}-${person.id}`} value={`${person.role}:${person.id}`}>
                                    {person.full_name} (Workforce Admin)
                                  </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        <Button className="w-full bg-[#13b6ec] hover:bg-[#0fa6d8] text-white" onClick={() => setDelegationOpen(null)}>Cancel</Button>
                        <Button 
                          onClick={() => { handleDelegate(item.id) }}
                          disabled={!delegateDepartmentId || !delegateAssignee}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Confirm Delegation
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>


    </div>
  )
}
