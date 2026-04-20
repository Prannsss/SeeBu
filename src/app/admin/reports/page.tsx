"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileWarning, MapPin, AlertCircle, CheckCircle2, FileText, Filter } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { gooeyToast } from "goey-toast"
import { Textarea } from "@/components/ui/textarea"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ReportMediaGallery } from "@/components/reports/report-media-gallery"

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("In Review");
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  const [delegationOpen, setDelegationOpen] = useState<string | null>(null);    
  const [reviewOpen, setReviewOpen] = useState<string | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [delegateDepartmentId, setDelegateDepartmentId] = useState("");
  const [delegateAssignee, setDelegateAssignee] = useState("");

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { apiClient } = await import('@/lib/api');
      // Try municipality-scoped fetch for admins; gracefully fallback to unfiltered reports.
      let municipalityId: string | undefined;
      try {
        const profileRes = await apiClient.users.me();
        municipalityId = profileRes?.data?.municipality_id || undefined;
      } catch {
        municipalityId = undefined;
      }

      const json = municipalityId
        ? await apiClient.reports.getAll({ municipality_id: municipalityId })
        : await apiClient.reports.getAll();
      return json.data;
    }
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
      gooeyToast.error("Please choose a department before approving.");
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
        gooeyToast.success(`Report ${id} approved and delegated.`);
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
    if (!rejectReason.trim()) {
      gooeyToast.error("Please provide a reason for rejection.");
      return;
    }
    updateStatusMutation.mutate({ id, status: 'Rejected', notes: 'Report rejected.', rejection_reason: rejectReason }, {
      onSuccess: () => {
        gooeyToast.success(`Report ${id} rejected. Reason: ${rejectReason}`);       
        setRejectMode(false);
        setRejectReason("");
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
        gooeyToast.success(`Report ${id} delegated successfully!`);
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
    const matchesUrgency = urgencyFilter === "All" || item.urgency === urgencyFilter;
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
          <TabsList className="flex w-full h-auto mb-6 bg-transparent border-b rounded-none p-0 overflow-x-auto no-scrollbar">
            <TabsTrigger
              value="In Review"
              className="flex-1 text-sm md:text-base py-3 px-4 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out whitespace-nowrap"
            >
              In Review
            </TabsTrigger>
            <TabsTrigger
              value="Action Taken"
              className="flex-1 text-sm md:text-base py-3 px-4 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out whitespace-nowrap"
            >
              Action Taken
            </TabsTrigger>
            <TabsTrigger
              value="Resolved"
              className="flex-1 text-sm md:text-base py-3 px-4 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-700 font-medium transition-all duration-300 ease-in-out whitespace-nowrap"
            >
              Resolved
            </TabsTrigger>
            <TabsTrigger
              value="Rejected"
              className="flex-1 text-sm md:text-base py-3 px-4 sm:px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-red-600 font-medium transition-all duration-300 ease-in-out whitespace-nowrap"
            >
              Rejected
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0 focus-visible:outline-none">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 col-span-full text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
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
                    <Card className="border-blue-100/70 bg-white/85 backdrop-blur hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2 flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:items-center">
                        <div>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" /> {item.barangay} • {item.date}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50/50 mt-2 sm:mt-0 whitespace-nowrap font-mono">{item.id}</Badge>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                          <span className="leading-snug">{item.timeline}</span>
                        </div>

                        {/* completed_by — shown on Resolved cards */}
                        {item.status === 'Resolved' && item.completedBy && (
                          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>Completed by: <span className="font-semibold">{item.completedBy}</span></span>
                          </div>
                        )}

                        {/* rejection_reason — shown on Rejected cards */}
                        {item.status === 'Rejected' && item.rejectionReason && (
                          <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg p-3">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span className="leading-snug"><span className="font-semibold">Reason:</span> {item.rejectionReason}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-2 border-t pt-3">
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status • Urgency</span>
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              item.urgency === 'High' ? 'bg-red-100 text-red-700' :
                              item.urgency === 'Medium' ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              <AlertCircle className="h-3 w-3" />
                              {item.urgency}
                            </div>
                            <div className={`flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full ${
                              item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              item.status === 'Action Taken' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            }`}>
                              {item.status === 'Resolved' && <CheckCircle2 className="h-4 w-4" />}
                              {item.status}
                            </div>
                          </div>
                        </div>

                        {item.status === 'In Review' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 w-full font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => {
                              setReviewOpen(item.id)
                              setRejectMode(false)
                              setRejectReason("")
                              setDelegateDepartmentId("")
                              setDelegateAssignee("")
                            }}
                          >
                            View &amp; Review
                          </Button>
                        )}

                        {item.status === 'Action Taken' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 w-full font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            View Progress
                          </Button>
                        )}
                        
                        {(item.status !== 'Resolved' && item.status !== 'In Review' && item.status !== 'Action Taken' && item.status !== 'Rejected') && (
                          <DialogTrigger asChild className="mt-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                            <Button variant="outline" size="sm" className="w-full font-medium">Delegate Task</Button>
                          </DialogTrigger>
                        )}
                        
                      </CardContent>
                    </Card>

                    {/* Review Dialog */}
                    <Dialog open={reviewOpen === item.id} onOpenChange={(open) => {
                      if (!open) {
                        setReviewOpen(null);
                        setRejectMode(false);
                        setDelegateDepartmentId("");
                        setDelegateAssignee("");
                      }
                    }}>
                      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-5xl rounded-xl max-h-[88vh] overflow-y-auto p-5 sm:p-7">
                        <DialogHeader>
                          <DialogTitle>Review Report</DialogTitle>
                          <DialogDescription>
                            Assess the report details below before taking action.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                          <div className="space-y-4">
                            <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border p-4 h-fit">
                              <div className="flex items-center justify-between mb-3">
                                <div className="font-semibold text-base text-slate-900 dark:text-slate-100">Review Report Details</div>
                                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">{item.id}</span>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Reporter Details</h4>
                                  <div className="text-sm text-muted-foreground mt-2 grid gap-2">
                                    <div className="flex justify-between border-b pb-2 gap-4">
                                      <span className="text-slate-500">Name:</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{item.reporterName}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2 gap-4">
                                      <span className="text-slate-500">Email:</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right break-all">{item.reporterEmail}</span>
                                    </div>
                                    <div className="flex justify-between pb-1 gap-4">
                                      <span className="text-slate-500">Contact Number:</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{item.reporterPhone}</span>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Report Details</h4>
                                  <div className="text-sm text-muted-foreground mt-2 grid gap-2">
                                    <div className="flex justify-between border-b pb-2 gap-4">
                                      <span className="text-slate-500">Urgency Level:</span>
                                      <span className={`font-medium text-right ${
                                        item.urgency === 'High'
                                          ? 'text-red-600 dark:text-red-400'
                                          : item.urgency === 'Medium'
                                            ? 'text-yellow-600 dark:text-yellow-400'
                                            : 'text-green-600 dark:text-green-400'
                                      }`}>{item.urgency}</span>
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

                            {!rejectMode ? (
                              <div className="space-y-3 rounded-lg border bg-slate-50/70 dark:bg-slate-900/60 p-3">
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
                                    Assign To Workforce Admin / Officer *
                                  </label>
                                  <Select value={delegateAssignee} onValueChange={setDelegateAssignee} disabled={!delegateDepartmentId}>
                                    <SelectTrigger id="approve-assignee" className="bg-white dark:bg-slate-900 border-slate-200">
                                      <SelectValue placeholder={delegateDepartmentId ? "Select assignee" : "Select department first"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-900 z-[100]">
                                      {selectedDepartmentPersonnel.map((person: any) => (
                                        <SelectItem key={`${person.role}-${person.id}`} value={`${person.role}:${person.id}`}>
                                          {person.full_name} ({person.role === 'workforce-admin' ? 'Workforce Admin' : 'Officer'})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            ) : null}

                            {rejectMode ? (
                              <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                                <label htmlFor="reject-reason" className="text-sm font-medium text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/> Reason for Rejection *</label>
                                <Textarea 
                                  id="reject-reason" 
                                  placeholder="Explain why this report is being rejected..." 
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  className="min-h-[100px] border-red-200 focus-visible:ring-red-500 bg-red-50/30"
                                />
                              </div>
                            ) : null}
                          </div>

                          <div className="space-y-4">
                            <Tabs defaultValue="reporter" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="reporter">Reporter Uploaded</TabsTrigger>
                                <TabsTrigger value="completion">Completion Proof</TabsTrigger>
                              </TabsList>
                              <TabsContent value="reporter" className="mt-3">
                                <ReportMediaGallery
                                  title="Reporter Uploaded Images"
                                  images={(item.reporterPhotos || []).map((url: string, index: number) => ({
                                    url,
                                    alt: `${item.title} reporter image ${index + 1}`
                                  }))}
                                  emptyText="No reporter images available for this report yet."
                                />
                              </TabsContent>
                              <TabsContent value="completion" className="mt-3">
                                <ReportMediaGallery
                                  title="Completion Proof Images"
                                  images={(item.completionPhotos || []).map((url: string, index: number) => ({
                                    url,
                                    alt: `${item.title} completion proof ${index + 1}`
                                  }))}
                                  emptyText="No completion proof submitted yet."
                                />
                              </TabsContent>
                            </Tabs>

                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-2">
                          <Button className="w-full bg-slate-600 hover:bg-slate-700 text-white" onClick={() => {
                            setReviewOpen(null);
                            setRejectMode(false);
                          }}>Close</Button>
                          
                          {rejectMode ? (
                            <>
                              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setRejectMode(false)}>Back</Button>
                              <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => handleReject(item.id)} variant="destructive">Confirm Rejection</Button>
                            </>
                          ) : (
                            <>
                              <Button onClick={() => setRejectMode(true)} className="w-full bg-red-600 hover:bg-red-700 text-white">Reject</Button>
                              <Button onClick={() => handleApprove(item.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Approve &amp; Delegate</Button>
                            </>
                          )}
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
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border p-3">
                          <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{item.title}</div>
                          <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.zone}</span>
                            <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {item.urgency}</span>
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
                              {selectedDepartmentPersonnel.map((person: any) => (
                                <SelectItem key={`${person.role}-${person.id}`} value={`${person.role}:${person.id}`}>
                                  {person.full_name} ({person.role === 'workforce-admin' ? 'Workforce Admin' : 'Officer'})
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
