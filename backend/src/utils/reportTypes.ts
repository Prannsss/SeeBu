// Report types offered by the report form (issue_type). Keep in sync with src/lib/report-types.ts.
export const NAMED_REPORT_TYPES = ['infrastructure', 'sanitation', 'safety', 'traffic', 'utilities', 'environment'] as const;
export const REPORT_TYPES = [...NAMED_REPORT_TYPES, 'other'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

/** `?issue_type=` → a known type (case-insensitive), undefined when absent, or null when it isn't one. */
export function parseReportType(value: unknown): ReportType | undefined | null {
  if (value === undefined || value === null || value === '') return undefined;
  const normalized = String(value).trim().toLowerCase();
  return (REPORT_TYPES as readonly string[]).includes(normalized) ? (normalized as ReportType) : null;
}

/**
 * Narrows a reports query to one type. "Other" also takes any value outside the named types
 * (the API accepts free-form issue_type), so every report falls under exactly one filter.
 */
export function filterByReportType(query: any, type: ReportType) {
  return type === 'other'
    ? query.not('issue_type', 'in', `(${NAMED_REPORT_TYPES.join(',')})`)
    : query.eq('issue_type', type);
}
