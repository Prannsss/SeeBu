"use client"

import { useEffect, useMemo, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { IssuesMapView } from "@/components/map/IssuesMapView"
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
  const [page, setPage] = useState(1)
  const municipalityId = currentUser?.municipality_id || undefined

  // "admin-reports" prefix: realtime updates and report actions refresh the map too.
  const { data: reportsPage, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-reports", municipalityId, "map", status, urgency, page],
    queryFn: async () => {
      const { apiClient } = await import("@/lib/api")
      return apiClient.reports.getAll({
        municipality_id: municipalityId,
        status: status === "All" ? undefined : status,
        urgency: urgency === "All" ? undefined : urgency,
        page,
        page_size: PAGE_SIZE,
      })
    },
    enabled: !!currentUser,
  })

  const { data: counts } = useQuery({
    queryKey: ["admin-reports", municipalityId, "counts", urgency],
    queryFn: async () => {
      const { apiClient } = await import("@/lib/api")
      const json = await apiClient.reports.getAll({
        municipality_id: municipalityId,
        urgency: urgency === "All" ? undefined : urgency,
        page: 1,
        page_size: 1,
        count_statuses: STATUSES,
      })
      return json.counts as Record<string, number> | undefined
    },
    placeholderData: keepPreviousData,
    enabled: !!currentUser,
  })

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
        <>We couldn&apos;t load your profile. <a href="/auth/login" className="font-semibold text-primary underline">Sign in again</a></>
      ) : undefined}
      filters={[{ value: "All", label: "All", count: allCount }, ...STATUSES.map((s) => ({ value: s, label: s, count: counts?.[s] }))]}
      activeFilter={status}
      onFilterChange={(v) => { setStatus(v); setPage(1) }}
      toolbar={
        <select
          aria-label="Filter by urgency"
          value={urgency}
          onChange={(e) => { setUrgency(e.target.value); setPage(1) }}
          className="h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-2 text-sm font-medium text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {URGENCIES.map((u) => <option key={u} value={u}>{u === "All" ? "Any urgency" : u}</option>)}
        </select>
      }
      legend={["review", "active", "resolved", "rejected"]}
      page={page}
      totalPages={totalPages}
      total={reportsPage?.pagination?.total}
      onPageChange={setPage}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
      detailsLink={(item) => ({
        href: "/admin/reports",
        label: item.status === "In Review" ? "Review in Reports" : "Open in Reports",
      })}
      emptyText="No reports with this status and urgency."
      noun="reports"
    />
  )
}
