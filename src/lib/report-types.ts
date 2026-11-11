import { CircleEllipsis, Construction, Recycle, ShieldAlert, TrafficCone, Trees, Zap, type LucideIcon } from "lucide-react"

// The report form's categories (issue_type), in the same order. Keep in sync with backend/src/utils/reportTypes.ts.
export const REPORT_TYPES = [
  { value: "infrastructure", label: "Infrastructure", icon: Construction },
  { value: "sanitation", label: "Sanitation", icon: Recycle },
  { value: "safety", label: "Safety & Security", icon: ShieldAlert },
  { value: "traffic", label: "Traffic", icon: TrafficCone },
  { value: "utilities", label: "Utilities", icon: Zap },
  { value: "environment", label: "Environment", icon: Trees },
  { value: "other", label: "Other", icon: CircleEllipsis },
] as const satisfies readonly { value: string; label: string; icon: LucideIcon }[]

export type ReportTypeValue = (typeof REPORT_TYPES)[number]["value"]
export type ReportTypeFilterValue = ReportTypeValue | "all"
export type ReportTypeInfo = (typeof REPORT_TYPES)[number]

const OTHER = REPORT_TYPES[REPORT_TYPES.length - 1]

/** A stored issue_type → its category. Anything unrecognised counts as "Other" (the API does the same). */
export function reportTypeOf(issueType?: string | null): ReportTypeInfo {
  const value = (issueType || "").trim().toLowerCase()
  return REPORT_TYPES.find((t) => t.value === value) ?? OTHER
}

/** Display name; an "Other" report shows what the reporter typed in, when they did. */
export function reportTypeLabel(issueType?: string | null, otherSpecification?: string | null): string {
  const type = reportTypeOf(issueType)
  const specified = otherSpecification?.trim()
  return type.value === "other" && specified ? specified : type.label
}
