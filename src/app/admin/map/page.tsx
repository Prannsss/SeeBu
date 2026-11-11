"use client"

import { useEffect, useMemo, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { SlidersHorizontal } from "lucide-react"
import { IssuesMapView } from "@/components/map/IssuesMapView"
import { FilterChip, ReportTypeFilter } from "@/components/reports/report-type-filter"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { ReportTypeFilterValue, ReportTypeValue } from "@/lib/report-types"
import { reportToMapItem } from "@/components/map/mappers"
import { useCurrentUser } from "@/hooks/queries/useCurrentUser"
import { useRealtimeReports } from "@/hooks/useRealtimeReports"

const PAGE_SIZE = 50 // backend max
const STATUSES = ["In Review", "Action Taken", "Resolved", "Rejected"]
const URGENCIES = ["All", "High", "Medium", "Low"]

export default function AdminMapPage() {
  const { data: currentUser, isPending: profilePending } = useCurrentUser()
  useRealtimeReports({ enableToasts: true, userRole: "admin", municipalityId: currentUser?.municipality_id })
  const [status, setStatus] = useState("In Review")
  const [urgency, setUrgency] = useState("All")
  const [type, setType] = useState<ReportTypeFilterValue>("all")
  const [page, setPage] = useState(1)
  const municipalityId = currentUser?.municipality_id || undefined
  const urgencyParam = urgency === "All" ? undefined : urgency
  const typeParam = type === "all" ? undefined : type

  // "admin-reports" prefix: realtime updates and report actions refresh the map too.
  const { data: reportsPage, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-reports", municipalityId, "map", status, urgency, type, page],
    queryFn: async () => {
      const { apiClient } = await import("@/lib/api")
      return apiClient.reports.getAll({
        municipality_id: municipalityId,
        status: status === "All" ? undefined : status,
        urgency: urgencyParam,
        issue_type: typeParam,
        page,
        page_size: PAGE_SIZE,
      })
    },
    enabled: !!currentUser,
  })

  const { data: counts } = useQuery({
    queryKey: ["admin-reports", municipalityId, "counts", urgency, type],
    queryFn: async () => {
      const { apiClient } = await import("@/lib/api")
      const json = await apiClient.reports.getAll({
        municipality_id: municipalityId,
        urgency: urgencyParam,
        issue_type: typeParam,
        page: 1,
        page_size: 1,
        count_statuses: STATUSES,
      })
      return json.counts as Record<string, number> | undefined
    },
    placeholderData: keepPreviousData,
    enabled: !!currentUser,
  })

  // Same key shape as the Reports page's type counts, so the two share the cache.
  const { data: typeCounts } = useQuery({
    queryKey: ["admin-reports", municipalityId, "type-counts", status, urgency],
    queryFn: async () => {
      const { apiClient } = await import("@/lib/api")
      const json = await apiClient.reports.getAll({
        municipality_id: municipalityId,
        status: status === "All" ? undefined : status,
        urgency: urgencyParam,
        page: 1,
        page_size: 1,
        count_issue_types: true,
      })
      // null (not undefined) when an older backend omits them: the chips then just show no counts.
      return (json.type_counts ?? null) as Partial<Record<ReportTypeValue, number>> | null
    },
    placeholderData: keepPreviousData,
    enabled: !!currentUser,
  })
  const activeFilterCount = (urgency !== "All" ? 1 : 0) + (type !== "all" ? 1 : 0)

  const totalPages: number | undefined = reportsPage?.pagination?.total_pages
  useEffect(() => {
    if (totalPages && page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const items = useMemo(() => (Array.isArray(reportsPage?.data) ? reportsPage.data.map(reportToMapItem) : []), [reportsPage])
  const allCount = counts ? STATUSES.reduce((sum, s) => sum + (counts[s] ?? 0), 0) : undefined

  return (
    <IssuesMapView
      title="Reports Map"
      subtitle={currentUser?.municipality_name || items[0]?.municipality || "Your municipality"}
      items={items}
      isLoading={profilePending || (!!currentUser && isLoading)}
      error={!profilePending && !currentUser ? (
        <>
          We couldn&apos;t load your profile.{" "}
          {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- a full page load drops the expired session's cached state */}
          <a href="/auth/login" className="font-semibold text-primary-ink underline">Sign in again</a>
        </>
      ) : undefined}
      filters={[{ value: "All", label: "All", count: allCount }, ...STATUSES.map((s) => ({ value: s, label: s, count: counts?.[s] }))]}
      activeFilter={status}
      onFilterChange={(v) => { setStatus(v); setPage(1) }}
      toolbar={
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={activeFilterCount ? `Filters, ${activeFilterCount} active` : "Filters"}
              className={`relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                activeFilterCount
                  ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold leading-none text-slate-900 dark:bg-slate-900 dark:text-white" aria-hidden="true">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] space-y-4 rounded-2xl border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div>
              <h2 id="map-urgency-filter" className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Urgency</h2>
              <div role="group" aria-labelledby="map-urgency-filter" className="flex flex-wrap gap-1.5">
                {URGENCIES.map((u) => (
                  <FilterChip
                    key={u}
                    label={u === "All" ? "Any urgency" : u}
                    active={urgency === u}
                    onClick={() => { setUrgency(u === urgency && u !== "All" ? "All" : u); setPage(1) }}
                  />
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Report type</h2>
              <ReportTypeFilter layout="wrap" value={type} counts={typeCounts ?? undefined} onChange={(t) => { setType(t); setPage(1) }} />
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                type="button"
                disabled={!activeFilterCount}
                onClick={() => { setUrgency("All"); setType("all"); setPage(1) }}
                className="rounded-md px-2 py-1 text-sm font-semibold text-primary-ink hover:underline disabled:pointer-events-none disabled:text-slate-400"
              >
                Clear filters
              </button>
            </div>
          </PopoverContent>
        </Popover>
      }
      legend={["review", "active", "resolved", "rejected"]}
      page={page}
      totalPages={totalPages}
      total={reportsPage?.pagination?.total}
      onPageChange={setPage}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
      detailsLink={(item) => ({
        // The Reports page opens this report's review (or details) dialog on arrival.
        href: `/admin/reports?report=${encodeURIComponent(item.id)}`,
        label: item.status === "In Review" ? "Review in Reports" : "Open in Reports",
      })}
      emptyText={activeFilterCount ? "No reports match these filters." : "No reports with this status."}
      noun="reports"
    />
  )
}
