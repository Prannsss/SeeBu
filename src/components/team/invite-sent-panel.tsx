"use client"

import { MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export type SentInvite = { name: string; email: string; place: string }

// Admins and superadmins serve a place ("an Admin for Cebu City"); department staff work in one.
const placePreposition = (roleLabel: string) => (roleLabel === "Admin" || roleLabel === "Super Admin" ? "for" : "in")

/** Shown in place of an invite form after its invitation goes out. */
export function InviteSentPanel({ invite, roleLabel, onReset }: { invite: SentInvite; roleLabel: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-6 gap-4" role="status">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
        <MailCheck className="h-7 w-7 text-emerald-600" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-1">Invitation sent</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
          We emailed <strong className="text-slate-900 dark:text-white">{invite.name}</strong> at{" "}
          <strong className="text-slate-900 dark:text-white break-all">{invite.email}</strong> an invitation to join as{" "}
          {/^[aeiou]/i.test(roleLabel) ? "an" : "a"} <strong className="text-slate-900 dark:text-white">{roleLabel}</strong>{" "}
          {placePreposition(roleLabel)} <strong className="text-slate-900 dark:text-white">{invite.place}</strong>, with a
          temporary password. We&apos;ll email you as soon as they accept or decline.
        </p>
      </div>
      <Button type="button" onClick={onReset} className="h-11 px-6 bg-[#00B2E2] hover:bg-[#0096C7] text-white font-medium rounded-lg">
        Invite Another {roleLabel}
      </Button>
    </div>
  )
}
