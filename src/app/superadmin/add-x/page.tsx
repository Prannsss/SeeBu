"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { UserPlus, ShieldAlert, ShieldCheck } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { gooeyToast } from "goey-toast"
import { apiClient, type InvitationRequest } from "@/lib/api"
import { INVITATIONS_KEY, InvitationHistory } from "@/components/team/invitation-history"
import { InviteSentPanel, type SentInvite } from "@/components/team/invite-sent-panel"

// Phone number formatter for Philippine format
const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "")
  if (digits.startsWith("63")) return "+63" + digits.slice(2, 12)
  if (digits.startsWith("0")) return "+63" + digits.slice(1, 11)
  const limited = digits.slice(0, 10)
  return limited ? "+63" + limited : ""
}

const TAB_CLASS =
  "flex items-center justify-center gap-2 py-3 rounded-lg text-slate-600 dark:text-slate-400 data-[state=active]:bg-[#EAF6FD] dark:data-[state=active]:bg-[#00B2E2]/10 data-[state=active]:text-[#001731] dark:data-[state=active]:text-white data-[state=active]:shadow-none transition-all font-medium"

/** Name, contact number and email: the same three fields on both invite forms. */
function PersonFields({
  prefix,
  name,
  setName,
  contact,
  setContact,
  email,
  setEmail,
}: {
  prefix: string
  name: string
  setName: (v: string) => void
  contact: string
  setContact: (v: string) => void
  email: string
  setEmail: (v: string) => void
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="floating-input !mt-0">
          <input id={`${prefix}-name`} type="text" placeholder=" " required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
          <label htmlFor={`${prefix}-name`}>Full Name</label>
          <span className="material-symbols-outlined input-icon">person</span>
        </div>
        <div className="floating-input !mt-0">
          <input
            id={`${prefix}-contact`}
            type="tel"
            placeholder=" "
            required
            inputMode="tel"
            maxLength={13}
            value={contact}
            onChange={(e) => setContact(formatPhoneNumber(e.target.value))}
          />
          <label htmlFor={`${prefix}-contact`}>Contact Number</label>
          <span className="material-symbols-outlined input-icon">call</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="floating-input !mt-0">
          <input
            id={`${prefix}-email`}
            type="email"
            placeholder=" "
            required
            maxLength={100}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={`${prefix}-email-hint`}
          />
          <label htmlFor={`${prefix}-email`}>Email Address</label>
          <span className="material-symbols-outlined input-icon">mail</span>
        </div>
        <p id={`${prefix}-email-hint`} className="text-xs text-slate-500 ml-1">
          The invitation and temporary password will be sent here. It&apos;s also their sign-in email.
        </p>
      </div>
    </>
  )
}

export default function SuperadminAddPage() {
  const [activeTab, setActiveTab] = useState("admin")
  const queryClient = useQueryClient()

  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => (await apiClient.locations.getAll()).data || [],
    staleTime: 24 * 60 * 60 * 1000,
  })

  // ── Admin invitation (for a chosen municipality) ──
  const [municipalityId, setMunicipalityId] = useState("")
  const [adminName, setAdminName] = useState("")
  const [adminContact, setAdminContact] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminSent, setAdminSent] = useState<SentInvite | null>(null)

  // ── Superadmin invitation (platform-wide) ──
  const [saName, setSaName] = useState("")
  const [saContact, setSaContact] = useState("")
  const [saEmail, setSaEmail] = useState("")
  const [saSent, setSaSent] = useState<SentInvite | null>(null)

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
        queryClient.invalidateQueries({ queryKey: ["superadmin-users"] })
        gooeyToast.success("Invitation sent!", { description: `We emailed ${request.email} their invitation.` })
      },
    })
  }

  const handleAdminInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!municipalityId) {
      gooeyToast.error("Please choose the municipality this admin will manage.")
      return
    }
    const municipalityName = locations.find((m: any) => m.id === municipalityId)?.name || municipalityId
    sendInvite(
      { role: "admin", municipality_id: municipalityId, full_name: adminName.trim(), email: adminEmail.trim(), contact_number: adminContact || undefined },
      (place) => setAdminSent({ name: adminName.trim(), email: adminEmail.trim(), place: place || municipalityName })
    )
  }

  const handleSuperadminInvite = (e: React.FormEvent) => {
    e.preventDefault()
    sendInvite(
      { role: "superadmin", full_name: saName.trim(), email: saEmail.trim(), contact_number: saContact || undefined },
      (place) => setSaSent({ name: saName.trim(), email: saEmail.trim(), place: place || "all municipalities" })
    )
  }

  const resetAdminForm = () => {
    setAdminSent(null)
    setMunicipalityId("")
    setAdminName("")
    setAdminContact("")
    setAdminEmail("")
  }

  const resetSuperadminForm = () => {
    setSaSent(null)
    setSaName("")
    setSaContact("")
    setSaEmail("")
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
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Invite municipal admins and fellow superadmins.</p>
          </div>
        </div>

        {/* Desktop: history on the left, form on the right. Mobile: the form comes first. */}
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-transparent p-0 gap-2">
              <TabsTrigger value="admin" className={TAB_CLASS}>
                <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Add Admin
              </TabsTrigger>
              <TabsTrigger value="superadmin" className={TAB_CLASS}>
                <ShieldAlert className="w-4 h-4" aria-hidden="true" /> Add Superadmin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin" className="!mt-0 outline-none border-0 w-full">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                {adminSent ? (
                  <InviteSentPanel invite={adminSent} roleLabel="Admin" onReset={resetAdminForm} />
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold mb-1">Invite a Municipal Admin</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Admins review reports and manage the team for one municipality. They&apos;ll get an email with a temporary
                        password and a link to accept the invitation.
                      </p>
                    </div>

                    <form className="flex flex-col gap-4" onSubmit={handleAdminInvite}>
                      <div className="floating-input !mt-0">
                        <select
                          id="municipality-select"
                          required
                          value={municipalityId}
                          onChange={(e) => setMunicipalityId(e.target.value)}
                          className="report-select"
                        >
                          <option value="" disabled>
                            {locationsLoading ? "Loading municipalities…" : "Select a municipality"}
                          </option>
                          {locations.map((m: any) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                        <label htmlFor="municipality-select">Assigned Area (Municipality/City)</label>
                        <span className="material-symbols-outlined input-icon">map</span>
                      </div>

                      <PersonFields
                        prefix="admin"
                        name={adminName}
                        setName={setAdminName}
                        contact={adminContact}
                        setContact={setAdminContact}
                        email={adminEmail}
                        setEmail={setAdminEmail}
                      />

                      {sendButton}
                    </form>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="superadmin" className="!mt-0 outline-none border-0 w-full">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                {saSent ? (
                  <InviteSentPanel invite={saSent} roleLabel="Super Admin" onReset={resetSuperadminForm} />
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold mb-1">Invite a Superadmin</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Superadmins have access across every municipality, including analytics and user management. Only invite
                        people you fully trust.
                      </p>
                    </div>

                    <form className="flex flex-col gap-4" onSubmit={handleSuperadminInvite}>
                      <PersonFields
                        prefix="sa"
                        name={saName}
                        setName={setSaName}
                        contact={saContact}
                        setContact={setSaContact}
                        email={saEmail}
                        setEmail={setSaEmail}
                      />

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
