"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { gooeyToast } from "goey-toast"
import { Inbox, MailX, RotateCcw, UserX } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ListSkeleton } from "@/components/ui/list-skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient, type TeamInvitation } from "@/lib/api"
import { cn } from "@/lib/utils"
import { lockedNote, rowAction, statusPill, tabOf, whenLine, type RowAction, type Tab } from "./invitation-rules"

/** The team's invitation history; invalidate it after sending an invitation. */
export const INVITATIONS_KEY = ["invitations"]

type Confirm = { invitation: TeamInvitation; action: RowAction }

const TABS: { key: Tab; label: string; activeClass: string }[] = [
  { key: "pending", label: "Pending", activeClass: "data-[state=active]:bg-blue-600" },
  { key: "accepted", label: "Accepted", activeClass: "data-[state=active]:bg-emerald-600" },
  { key: "cancelled", label: "Cancelled", activeClass: "data-[state=active]:bg-slate-600" },
]

const EMPTY: Record<Tab, { title: string; hint: string }> = {
  pending: { title: "No pending invitations", hint: "Invitations wait here until they're accepted, declined, or expire." },
  accepted: { title: "No one has joined yet", hint: "People who accept an invitation show up here." },
  cancelled: { title: "Nothing here", hint: "Cancelled, declined, expired, and revoked invitations show up here." },
}

const BUTTON: Record<RowAction, { label: string; busy: string; icon: typeof MailX; className: string }> = {
  cancel: { label: "Cancel Invite", busy: "Cancelling…", icon: MailX, className: "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/60 dark:hover:bg-red-950/40" },
  revoke: { label: "Revoke Access", busy: "Revoking…", icon: UserX, className: "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/60 dark:hover:bg-red-950/40" },
  restore: { label: "Restore Access", busy: "Restoring…", icon: RotateCcw, className: "border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800 dark:border-sky-900/60 dark:hover:bg-sky-950/40" },
}

function confirmCopy({ invitation: inv, action }: Confirm) {
  if (action === "cancel") {
    return {
      title: "Cancel this invitation?",
      body: `${inv.name}'s invitation link and temporary password will stop working right away, and we'll let them know by email. You can invite them again anytime.`,
      keep: "Keep Invitation",
      go: "Cancel Invitation",
    }
  }
  if (action === "revoke") {
    return {
      title: `Revoke ${inv.name}'s access?`,
      body:
        "They'll be signed out and won't be able to sign in to SeeBu anymore. The reports and tasks they handled stay on record, and we'll let them know by email." +
        (inv.role === "workforce" ? " Afterwards, reassign any tasks they still have from your Tasks page." : "") +
        " You can restore their access later.",
      keep: "Keep Access",
      go: "Revoke Access",
    }
  }
  return {
    title: `Restore ${inv.name}'s access?`,
    body: "We'll email them a new temporary password. They'll choose their own password when they sign in, and everything they worked on is still there.",
    keep: "Not Now",
    go: "Restore Access",
  }
}

const DONE: Record<RowAction, (name: string) => [string, string]> = {
  cancel: (name) => ["Invitation cancelled", `${name}'s invitation link no longer works. We're emailing them to let them know.`],
  revoke: (name) => ["Access revoked", `${name} has been signed out and can no longer sign in.`],
  restore: (name) => ["Access restored", `We emailed ${name} a new temporary password.`],
}

/** Pending / Accepted / Cancelled invitations for the viewer's team, with cancel, revoke and restore. */
export function InvitationHistory({ className }: { className?: string }) {
  const [tab, setTab] = useState<Tab>("pending")
  // Kept after closing so the dialog doesn't go blank while it animates out.
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: invitations, isLoading, isError, refetch } = useQuery({
    queryKey: INVITATIONS_KEY,
    queryFn: async () => (await apiClient.invitations.list()).data ?? [],
  })

  const act = useMutation({
    mutationFn: ({ invitation, action }: Confirm) => apiClient.invitations[action](invitation.id),
    onSuccess: (_result, { invitation, action }) => {
      const [title, description] = DONE[action](invitation.name)
      gooeyToast.success(title, { description })
    },
    onError: (error: any) => gooeyToast.error("Something went wrong", { description: error?.message || "Please try again." }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: INVITATIONS_KEY }),
  })

  const rows = invitations ?? []
  const inTab = (key: Tab) => rows.filter((inv) => tabOf(inv) === key)
  const busy = (inv: TeamInvitation) => act.isPending && act.variables?.invitation.id === inv.id
  const ask = (invitation: TeamInvitation, action: RowAction) => {
    setConfirm({ invitation, action })
    setConfirmOpen(true)
  }
  const copy = confirm && confirmCopy(confirm)

  return (
    <section
      aria-labelledby="invitation-history-title"
      className={cn("bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800", className)}
    >
      <div className="mb-6">
        <h2 id="invitation-history-title" className="text-xl font-semibold mb-1">Invitations</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Everyone your team has invited, newest first.</p>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-3 h-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-1">
          {TABS.map(({ key, label, activeClass }) => (
            <TabsTrigger
              key={key}
              value={key}
              className={cn("rounded py-2 text-xs sm:text-sm font-semibold truncate data-[state=active]:text-white transition-all", activeClass)}
            >
              {label} ({inTab(key).length})
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(({ key }) => (
          <TabsContent key={key} value={key} className="m-0 focus-visible:outline-none">
            {isLoading ? (
              <div className="grid gap-3">
                <ListSkeleton count={2} />
              </div>
            ) : isError && !invitations ? (
              <div className="flex flex-col items-center gap-3 text-center py-10 px-4 rounded-md border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">We couldn&apos;t load your invitations.</p>
                <Button type="button" variant="outline" onClick={() => refetch()}>Try Again</Button>
              </div>
            ) : inTab(key).length === 0 ? (
              <div className="flex flex-col items-center text-center py-10 px-4 rounded-md border border-dashed border-slate-300 dark:border-slate-700">
                <Inbox className="w-10 h-10 text-slate-500 mb-3" aria-hidden="true" />
                <p className="text-base font-semibold text-slate-900 dark:text-white">{EMPTY[key].title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{EMPTY[key].hint}</p>
              </div>
            ) : (
              <ul className="grid gap-3">
                {inTab(key).map((inv) => {
                  const pill = statusPill(inv)
                  const action = rowAction(inv)
                  const note = lockedNote(inv)
                  const button = action && BUTTON[action]
                  return (
                    <li key={inv.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {inv.name}
                            {inv.isYou && <span className="font-normal text-slate-500 dark:text-slate-400"> (you)</span>}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 break-all">{inv.email}</p>
                        </div>
                        {pill && <Badge variant={pill.variant}>{pill.label}</Badge>}
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {inv.roleLabel}
                          {inv.role === "workforce-admin" && inv.department ? ` · ${inv.department}` : ""}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {whenLine(inv)} · Invited by {inv.invitedByYou ? "you" : inv.invitedBy || "a teammate"}
                        </p>
                        {note && <p className="text-xs italic text-slate-500 dark:text-slate-400">{note}</p>}
                      </div>

                      {action && button && (
                        <Button
                          type="button"
                          variant="outline"
                          className={cn("w-full sm:w-auto sm:self-end h-10", button.className)}
                          aria-label={`${button.label} for ${inv.name}`}
                          disabled={busy(inv)}
                          onClick={() => ask(inv, action)}
                        >
                          <button.icon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                          {busy(inv) ? button.busy : button.label}
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="sm:rounded-[16px] rounded-[16px] max-w-[90vw] sm:max-w-md w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">{copy?.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-600 dark:text-slate-400">{copy?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-3 sm:gap-3">
            <AlertDialogCancel className="h-11 rounded-md font-bold bg-sky-700 hover:bg-sky-800 text-white hover:text-white border-sky-700 m-0">
              {copy?.keep}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirm && act.mutate(confirm)}
              className={cn(
                "h-11 rounded-md text-white font-bold shadow-sm",
                confirm?.action === "restore" ? "bg-primary hover:bg-primary-dark" : "bg-red-600 hover:bg-red-700"
              )}
            >
              {copy?.go}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
