"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { UserPlus, HardHat, ShieldCheck } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { gooeyToast } from "goey-toast"
import { apiClient, type InvitationRequest } from "@/lib/api"
import { useCurrentUser } from "@/hooks/queries/useCurrentUser"
import { INVITATIONS_KEY, InvitationHistory } from "@/components/team/invitation-history"
import { InviteSentPanel, type SentInvite } from "@/components/team/invite-sent-panel"

const NEW_DEPARTMENT = "__new__"

// Phone number formatter for Philippine format
const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "")
  if (digits.startsWith("63")) return "+63" + digits.slice(2, 12)
  if (digits.startsWith("0")) return "+63" + digits.slice(1, 11)
  const limited = digits.slice(0, 10)
  return limited ? "+63" + limited : ""
}

export default function AdminAddPage() {
  const [activeTab, setActiveTab] = useState("admin")
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => (await apiClient.locations.getAll()).data || [],
    staleTime: 24 * 60 * 60 * 1000,
  })
  const municipalityName =
    locations.find((m: any) => m.id === currentUser?.municipality_id)?.name || currentUser?.municipality_id || "Loading..."

  // ── Co-admin invitation ──
  const [adminName, setAdminName] = useState("")
  const [adminContact, setAdminContact] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminSent, setAdminSent] = useState<SentInvite | null>(null)

  // ── Workforce admin invitation ──
  const [deptChoice, setDeptChoice] = useState("")
  const [newDeptName, setNewDeptName] = useState("")
  const [wfName, setWfName] = useState("")
  const [wfContact, setWfContact] = useState("")
  const [wfEmail, setWfEmail] = useState("")
  const [wfSent, setWfSent] = useState<SentInvite | null>(null)

  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ["admin-departments"],
    queryFn: async () => (await apiClient.departments.getAll()).data || [],
  })

  const chooseDepartment = (value: string) => {
    setDeptChoice(value)
    // Existing departments may already have an email on file; use it unless one was typed.
    const department = departments.find((d: any) => String(d.id) === value)
    if (department?.department_email && !wfEmail) setWfEmail(department.department_email)
  }

  const inviteMutation = useMutation({
    mutationFn: (request: InvitationRequest) => apiClient.invitations.create(request),
    onError: (error: any) => {
      gooeyToast.error("Couldn't Send Invitation", { description: error?.message || "Please try again." })
    },
  })

  const sendInvite = (request: InvitationRequest, onSent: (place: string) => void) => {
    inviteMutation.mutate(request, {
      onSuccess: (result: any) => {
        onSent(result?.data?.place || "")
        queryClient.invalidateQueries({ queryKey: INVITATIONS_KEY })
        gooeyToast.success("Invitation sent!", { description: `We emailed ${request.email} their invitation.` })
      },
    })
  }

  const handleAdminInvite = (e: React.FormEvent) => {
    e.preventDefault()
    sendInvite(
      { role: "admin", full_name: adminName.trim(), email: adminEmail.trim(), contact_number: adminContact || undefined },
      (place) => setAdminSent({ name: adminName.trim(), email: adminEmail.trim(), place: place || municipalityName })
    )
  }

  const handleWorkforceInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!deptChoice) {
      gooeyToast.error("Please choose a department, or create a new one.")
      return
    }
    sendInvite(
      {
        role: "workforce-admin",
        full_name: wfName.trim(),
        email: wfEmail.trim(),
        contact_number: wfContact || undefined,
        ...(deptChoice === NEW_DEPARTMENT ? { new_department_name: newDeptName.trim() } : { department_id: deptChoice }),
      },
      (place) => {
        setWfSent({ name: wfName.trim(), email: wfEmail.trim(), place: place || newDeptName.trim() })
        queryClient.invalidateQueries({ queryKey: ["admin-departments"] })
      }
    )
  }

  const resetAdminForm = () => {
    setAdminSent(null)
    setAdminName("")
    setAdminContact("")
    setAdminEmail("")
  }

  const resetWorkforceForm = () => {
    setWfSent(null)
    setDeptChoice("")
    setNewDeptName("")
    setWfName("")
    setWfContact("")
    setWfEmail("")
  }

  const sendButton = (
    <Button
      className="w-full h-12 mt-4 text-base bg-[#00B2E2] hover:bg-[#0096C7] text-white font-medium shadow-sm transition-all rounded-lg"
      type="submit"
      disabled={inviteMutation.isPending}
    >
      {inviteMutation.isPending ? "Sending Invitation…" : "Send Invitation"}
    </Button>
  )

  return (
    <div className="min-h-screen overflow-y-scroll bg-slate-50 pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-6xl px-5 pt-10 pb-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e5f7fd] dark:bg-[#00B2E2]/20">
            <UserPlus className="h-6 w-6 text-[#00B2E2] dark:text-[#00B2E2]" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">Expand your administrative team and register municipal workforce departments.</p>
          </div>
        </div>

        {/* Desktop: history on the left, form on the right. Mobile: the form comes first. */}
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-transparent p-0 gap-2">
              <TabsTrigger
                value="admin"
                className="flex items-center justify-center gap-2 py-3 rounded-lg text-slate-600 dark:text-slate-400 data-[state=active]:bg-[#EAF6FD] dark:data-[state=active]:bg-[#00B2E2]/10 data-[state=active]:text-[#001731] dark:data-[state=active]:text-white data-[state=active]:shadow-none transition-all font-medium"
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Add Co-Admin
              </TabsTrigger>
              <TabsTrigger
                value="workforce"
                className="flex items-center justify-center gap-2 py-3 rounded-lg text-slate-600 dark:text-slate-400 data-[state=active]:bg-[#EAF6FD] dark:data-[state=active]:bg-[#00B2E2]/10 data-[state=active]:text-[#001731] dark:data-[state=active]:text-white data-[state=active]:shadow-none transition-all font-medium"
              >
                <HardHat className="w-4 h-4" aria-hidden="true" /> Add Workforce Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin" className="!mt-0 outline-none border-0 w-full">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                {adminSent ? (
                  <InviteSentPanel invite={adminSent} roleLabel="Admin" onReset={resetAdminForm} />
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold mb-1">Invite a Co-Admin</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Invite another admin to help manage {municipalityName}. They&apos;ll get an email with a temporary password
                        and a link to accept the invitation.
                      </p>
                    </div>

                    <form className="flex flex-col gap-4" onSubmit={handleAdminInvite}>
                      <div className="floating-input !mt-0">
                        <input
                          id="assigned-area"
                          type="text"
                          placeholder=" "
                          value={municipalityName}
                          disabled
                          className="bg-slate-50 dark:bg-[#111827] text-slate-500 cursor-not-allowed"
                        />
                        <label htmlFor="assigned-area">Assigned Area</label>
                        <span className="material-symbols-outlined input-icon">map</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="floating-input !mt-0">
                          <input
                            id="admin-name"
                            type="text"
                            placeholder=" "
                            required
                            maxLength={100}
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                          />
                          <label htmlFor="admin-name">Full Name</label>
                          <span className="material-symbols-outlined input-icon">person</span>
                        </div>
                        <div className="floating-input !mt-0">
                          <input
                            id="admin-contact"
                            type="tel"
                            placeholder=" "
                            required
                            inputMode="tel"
                            maxLength={13}
                            value={adminContact}
                            onChange={(e) => setAdminContact(formatPhoneNumber(e.target.value))}
                          />
                          <label htmlFor="admin-contact">Contact Number</label>
                          <span className="material-symbols-outlined input-icon">call</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="floating-input !mt-0">
                          <input
                            id="admin-email"
                            type="email"
                            placeholder=" "
                            required
                            maxLength={100}
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            aria-describedby="admin-email-hint"
                          />
                          <label htmlFor="admin-email">Email Address</label>
                          <span className="material-symbols-outlined input-icon">mail</span>
                        </div>
                        <p id="admin-email-hint" className="text-xs text-slate-500 ml-1">
                          The invitation and temporary password will be sent here. It&apos;s also their sign-in email.
                        </p>
                      </div>

                      {sendButton}
                    </form>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="workforce" className="!mt-0 outline-none border-0 w-full">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                {wfSent ? (
                  <InviteSentPanel invite={wfSent} roleLabel="Workforce Admin" onReset={resetWorkforceForm} />
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold mb-1">Invite a Workforce Admin</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Choose the department they&apos;ll lead (e.g. Sanitation, Roads), or create a new one. They&apos;ll get an email
                        with a temporary password and a link to accept the invitation.
                      </p>
                    </div>

                    <form className="flex flex-col gap-4" onSubmit={handleWorkforceInvite}>
                      <div className="floating-input !mt-0">
                        <select
                          id="dept-select"
                          required
                          value={deptChoice}
                          onChange={(e) => chooseDepartment(e.target.value)}
                          className="report-select"
                        >
                          <option value="" disabled>
                            {departmentsLoading ? "Loading departments…" : "Select a department"}
                          </option>
                          {departments.map((d: any) => (
                            <option key={d.id} value={String(d.id)}>{d.name}</option>
                          ))}
                          <option value={NEW_DEPARTMENT}>+ Create a new department</option>
                        </select>
                        <label htmlFor="dept-select">Department</label>
                        <span className="material-symbols-outlined input-icon">corporate_fare</span>
                      </div>

                      {deptChoice === NEW_DEPARTMENT && (
                        <div className="floating-input !mt-0">
                          <input
                            id="dept-name"
                            type="text"
                            placeholder=" "
                            required
                            maxLength={100}
                            value={newDeptName}
                            onChange={(e) => setNewDeptName(e.target.value)}
                          />
                          <label htmlFor="dept-name">New Department Name</label>
                          <span className="material-symbols-outlined input-icon">add_business</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="floating-input !mt-0">
                          <input
                            id="wf-name"
                            type="text"
                            placeholder=" "
                            required
                            maxLength={100}
                            value={wfName}
                            onChange={(e) => setWfName(e.target.value)}
                          />
                          <label htmlFor="wf-name">Contact Person (Admin Name)</label>
                          <span className="material-symbols-outlined input-icon">badge</span>
                        </div>
                        <div className="floating-input !mt-0 relative">
                          <input
                            id="wf-contact"
                            type="tel"
                            placeholder=" "
                            required
                            inputMode="tel"
                            maxLength={13}
                            value={wfContact}
                            onChange={(e) => setWfContact(formatPhoneNumber(e.target.value))}
                          />
                          <label htmlFor="wf-contact">Contact Number</label>
                          <span className="material-symbols-outlined input-icon">call</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="floating-input !mt-0">
                          <input
                            id="wf-email"
                            type="email"
                            placeholder=" "
                            required
                            maxLength={100}
                            value={wfEmail}
                            onChange={(e) => setWfEmail(e.target.value)}
                            aria-describedby="wf-email-hint"
                          />
                          <label htmlFor="wf-email">Department Email Address</label>
                          <span className="material-symbols-outlined input-icon">mail</span>
                        </div>
                        <p id="wf-email-hint" className="text-xs text-slate-500 ml-1">
                          The invitation and temporary password will be sent here. It&apos;s also their sign-in email.
                        </p>
                      </div>

                      {sendButton}
                    </form>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <InvitationHistory className="lg:order-first min-w-0" />
        </div>
      </div>
    </div>
  )
}
