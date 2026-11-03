import { toneOf, type MapItem } from "./types";

const photosOf = (photos: any[] | undefined, completion: boolean) =>
  (photos || []).filter((p) => !!p?.is_completion_photo === completion).map((p) => p.photo_url).filter(Boolean);

const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));

/** API report row → map item. */
export function reportToMapItem(r: any): MapItem {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status || "In Review",
    tone: toneOf(r.status),
    urgency: r.urgency,
    issueType: r.issue_type,
    street: r.location,
    barangay: r.barangays?.name,
    municipality: r.municipalities?.name,
    landmark: r.landmark,
    createdAt: r.created_at,
    photos: photosOf(r.report_photos, false),
    completionPhotos: photosOf(r.report_photos, true),
    meta: r.status === "Rejected" && r.rejection_reason ? [{ label: "Rejection reason", value: r.rejection_reason }] : undefined,
    // Picked up automatically if reports ever store coordinates.
    lat: num(r.latitude),
    lng: num(r.longitude),
  };
}

/** API task row (with its related_report) → map item. */
export function taskToMapItem(t: any, opts?: { statusLabel?: (status: string) => string; meta?: (t: any) => MapItem["meta"] }): MapItem {
  const r = t.related_report || {};
  const status = t.status || "Pending";
  return {
    id: t.id,
    title: t.title || r.title,
    description: r.description,
    status,
    statusLabel: opts?.statusLabel?.(status),
    tone: toneOf(status),
    urgency: t.priority || r.urgency,
    street: r.location || t.location,
    barangay: r.barangays?.name,
    municipality: r.municipalities?.name,
    landmark: r.landmark || t.landmark,
    createdAt: t.created_at,
    photos: photosOf(r.report_photos, false),
    completionPhotos: photosOf(r.report_photos, true),
    meta: opts?.meta?.(t),
    reportId: r.id || t.related_report_id || undefined,
    lat: num(r.latitude),
    lng: num(r.longitude),
  };
}
