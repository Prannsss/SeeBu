// What each invitation row shows and offers. Pure, so it's unit-tested (invitation-rules.test.ts).
import type { BadgeProps } from "@/components/ui/badge"
import type { TeamInvitation } from "@/lib/api"
import { formatPhDate } from "@/lib/ph-date"

export type Tab = "pending" | "accepted" | "cancelled"
export type RowAction = "cancel" | "revoke" | "restore"
type Pill = { label: string; variant: BadgeProps["variant"] }

// Everything that can't be acted on anymore lands in "Cancelled", labelled with what happened.
export const CLOSED: Record<string, Pill> = {
  cancelled: { label: "Cancelled", variant: "neutral" },
  declined: { label: "Declined", variant: "warning" },
  expired: { label: "Expired", variant: "warning" },
  replaced: { label: "Replaced", variant: "info" },
  revoked: { label: "Access revoked", variant: "destructive" },
}

export const tabOf = (inv: TeamInvitation): Tab =>
  inv.state === "pending" ? "pending" : inv.state === "accepted" ? "accepted" : "cancelled"

// A revoked member can come back only while their account still exists (deactivated, not deleted).
const restorable = (inv: TeamInvitation) => inv.state === "revoked" && inv.accountStatus === "Inactive"

/** The button a row would offer to whoever may manage it. Nobody revokes themselves. */
function possibleAction(inv: TeamInvitation): RowAction | null {
  if (inv.state === "pending") return "cancel"
  if (inv.state === "accepted" && !inv.isYou) return "revoke"
  if (restorable(inv)) return "restore"
  return null
}

/** The button this viewer gets on a row, if any. */
export const rowAction = (inv: TeamInvitation): RowAction | null => (inv.canManage ? possibleAction(inv) : null)

/** Why a row has no button although it could have one: a teammate sent it and is still on the team. */
export function lockedNote(inv: TeamInvitation): string | null {
  if (inv.canManage || !possibleAction(inv)) return null
  return `Only ${inv.invitedBy || "the person who sent it"} can change this.`
}

/** Status pill: none while pending; the account's state once accepted; what happened once closed. */
export function statusPill(inv: TeamInvitation): Pill | null {
  if (inv.state === "pending") return null
  if (inv.state === "accepted") {
    if (inv.accountStatus === "Active") return { label: "Active", variant: "success" }
    if (inv.accountStatus === "Pending Setup") return { label: "Setup pending", variant: "warning" }
    return { label: "Inactive", variant: "neutral" }
  }
  return CLOSED[inv.state]
}

/** "Sent Oct 17, 2026 · Expires Oct 24, 2026", "Joined …", "Declined …", in Philippine time. */
export function whenLine(inv: TeamInvitation): string {
  const changed = formatPhDate(inv.respondedAt ?? inv.createdAt)
  if (inv.state === "pending") return `Sent ${formatPhDate(inv.createdAt)} · Expires ${formatPhDate(inv.expiresAt)}`
  if (inv.state === "accepted") return `Joined ${changed}`
  if (inv.state === "expired") return `Expired ${formatPhDate(inv.expiresAt)}`
  return `${CLOSED[inv.state].label} ${changed}`
}
