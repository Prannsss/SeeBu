"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { gooeyToast } from "goey-toast"
import { MailCheck, UserPlus } from "lucide-react"
import { useCurrentUser } from "@/hooks/queries/useCurrentUser"
import { apiClient } from "@/lib/api"
import { INVITATIONS_KEY, InvitationHistory } from "@/components/team/invitation-history"

export default function AddOfficerPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [inviteSent, setInviteSent] = useState<{ name: string; email: string } | null>(null)
  const { data: profileData } = useCurrentUser()
  const queryClient = useQueryClient()

  const { data: departmentsData } = useQuery({
    queryKey: ['workforce-admin-departments'],
    queryFn: async () => (await apiClient.departments.getAll()).data || [],
  })

  // Officers always join the inviting workforce admin's department (the backend enforces this too).
  const department = Array.isArray(departmentsData)
    ? departmentsData.find((d: any) => String(d.id) === String(profileData?.department_id)) || departmentsData[0]
    : null

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.invitations.create({
        role: "workforce",
        full_name: fullName,
        email: email.trim(),
        contact_number: phone || undefined,
      }),
    onSuccess: () => {
      setInviteSent({ name: fullName, email: email.trim() })
      queryClient.invalidateQueries({ queryKey: INVITATIONS_KEY })
      gooeyToast.success("Invitation sent!", { description: `We emailed ${email.trim()} their invitation.` })
    },
    onError: (error: any) => {
      gooeyToast.error("Couldn't Send Invitation", { description: error?.message?.trim() || "Please try again." })
    },
  })

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!department) {
      gooeyToast.error("Unable to resolve your department. Please reload and try again.")
      return
    }
    mutation.mutate()
  }

  const resetForm = () => {
    setInviteSent(null)
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhone("")
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto max-w-5xl px-4 pt-10 pb-6">

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50">
            <UserPlus className="h-6 w-6 text-orange-700 dark:text-orange-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-text-main dark:text-white mb-1">Register Officer</h1>
            <p className="text-base text-text-muted dark:text-gray-400">
              Invite a new officer to join your department.
            </p>
          </div>
        </div>

        {/* Desktop: history on the left, form on the right. Mobile: the form comes first. */}
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="min-w-0 bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in fade-in duration-500">
            {inviteSent ? (
              <div className="flex flex-col items-center text-center py-4 gap-4" role="status">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <MailCheck className="h-7 w-7 text-emerald-600" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-main dark:text-white mb-1">Invitation sent</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    We emailed <strong className="text-slate-900 dark:text-white">{inviteSent.name}</strong> at{" "}
                    <strong className="text-slate-900 dark:text-white break-all">{inviteSent.email}</strong> an invitation to join{" "}
                    <strong className="text-slate-900 dark:text-white">{department?.name || "your department"}</strong>, with a temporary
                    password. We&apos;ll email you as soon as they accept or decline.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={resetForm}
                  className="h-11 px-6 bg-primary hover:bg-primary-dark text-white font-bold"
                >
                  Invite Another Officer
                </Button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleInvite}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="floating-input">
                    <input
                      id="officer-first-name"
                      type="text"
                      placeholder=" "
                      required
                      maxLength={50}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <label htmlFor="officer-first-name">First Name</label>
                    <span className="material-symbols-outlined input-icon">person</span>
                  </div>
                  <div className="floating-input">
                    <input
                      id="officer-last-name"
                      type="text"
                      placeholder=" "
                      required
                      maxLength={50}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                    <label htmlFor="officer-last-name">Last Name</label>
                    <span className="material-symbols-outlined input-icon">person</span>
                  </div>
                </div>

                <div>
                  <div className="floating-input">
                    <input
                      id="officer-email"
                      type="email"
                      placeholder=" "
                      required
                      maxLength={100}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-describedby="officer-email-hint"
                    />
                    <label htmlFor="officer-email">Email Address</label>
                    <span className="material-symbols-outlined input-icon">mail</span>
                  </div>
                  <p id="officer-email-hint" className="text-xs text-slate-500 mt-1 ml-1">
                    The invitation and temporary password will be sent here. It&apos;s also their sign-in email.
                  </p>
                </div>

                <div className="floating-input">
                  <input
                    id="officer-contact"
                    type="tel"
                    placeholder=" "
                    required
                    maxLength={20}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <label htmlFor="officer-contact">Contact Number</label>
                  <span className="material-symbols-outlined input-icon">call</span>
                </div>

                <div className="floating-input">
                  <input
                    id="officer-department"
                    type="text"
                    placeholder=" "
                    value={department?.name || "Loading department..."}
                    disabled
                  />
                  <label htmlFor="officer-department">Assigned Department</label>
                  <span className="material-symbols-outlined input-icon">domain</span>
                </div>

                <Button
                  className="w-full h-12 mt-4 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-all"
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Sending Invitation…" : "Send Invitation"}
                </Button>
              </form>
            )}
          </div>

          <InvitationHistory className="lg:order-first min-w-0 rounded-md" />
        </div>
      </div>
    </div>
  )
}
