import type { GeoPoint } from "@/lib/geocode";

/** Pin colour and legend group. */
export type MapTone = "review" | "active" | "resolved" | "rejected";

/** One pinnable record (a report or a task), already shaped for display. */
export type MapItem = {
  id: string;
  title: string;
  description?: string;
  status: string;
  /** Status shown to the viewer when it differs from the stored one (e.g. "Accepted" → "In Progress"). */
  statusLabel?: string;
  tone: MapTone;
  urgency?: string;
  issueType?: string;
  street?: string;
  barangay?: string;
  municipality?: string;
  landmark?: string;
  /** ISO timestamp. */
  createdAt?: string;
  photos?: string[];
  completionPhotos?: string[];
  /** Extra label/value rows for the details modal (e.g. "Assigned to"). */
  meta?: { label: string; value: string }[];
  /** Linked report id when the item is a task. */
  reportId?: string;
  lat?: number | null;
  lng?: number | null;
};

export type PinnedItem = MapItem & { point?: GeoPoint };

export type MapFilter = { value: string; label: string; count?: number };

export const TONE_STYLES: Record<MapTone, { pin: string; dot: string; label: string }> = {
  review: { pin: "#d97706", dot: "bg-amber-600", label: "Needs action" },
  active: { pin: "#2563eb", dot: "bg-blue-600", label: "In progress" },
  resolved: { pin: "#059669", dot: "bg-emerald-600", label: "Resolved" },
  rejected: { pin: "#b91c1c", dot: "bg-red-700", label: "Rejected" },
};

/** Status (report or task) → pin colour. */
export function toneOf(status?: string | null): MapTone {
  const s = (status || "").trim().toLowerCase();
  if (["resolved", "completed"].includes(s)) return "resolved";
  if (s === "rejected") return "rejected";
  if (["action taken", "delegated", "approved", "accepted", "in progress"].includes(s)) return "active";
  return "review"; // In Review, Pending, Assigned, unknown
}
