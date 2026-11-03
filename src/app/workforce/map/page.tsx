"use client"

import { useEffect, useMemo, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { IssuesMapView } from "@/components/map/IssuesMapView"
import { taskToMapItem } from "@/components/map/mappers"
import { useCurrentUser } from "@/hooks/queries/useCurrentUser"
import { useRealtimeReports } from "@/hooks/useRealtimeReports"

const PAGE_SIZE = 50 // backend max
// Officer tabs on the backend: Assigned (to accept), Accepted (in progress), Completed.
const TABS = [
  { value: "Assigned", label: "To Accept" },
  { value: "Accepted", label: "In Progress" },
  { value: "Completed", label: "Completed" },
]

const statusLabel = (status: string) => (status === "Accepted" ? "In Progress" : status)

export default function WorkforceMapPage() {
  const { data: profile, isPending: profilePending } = useCurrentUser()
  const userId = profile?.id
  useRealtimeReports({ enableToasts: true, userRole: "workforce", userId })
  const [tab, setTab] = useState("Accepted")
  const [page, setPage] = useState(1)

  // "tasks" prefix so accepting/completing a task elsewhere refreshes the map.
  const { data: tasksPage, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["tasks", "officer", userId, "map", tab, page],
    queryFn: async () => {
      const { apiClient } = await import("@/lib/api")
      return apiClient.tasks.getAll({ tab: tab === "All" ? undefined : tab, page, page_size: PAGE_SIZE })
    },
    enabled: !!profile,
  })

  const { data: counts } = useQuery({
    queryKey: ["tasks", "officer", userId, "counts"],
    queryFn: async () => {
      const { apiClient } = await import("@/lib/api")
      return (await apiClient.tasks.getAll({ page: 1, page_size: 1, count_tabs: true })).counts as Record<string, number> | undefined
    },
    placeholderData: keepPreviousData,
    enabled: !!profile,
  })

  const totalPages: number | undefined = tasksPage?.pagination?.total_pages
  useEffect(() => {
    if (totalPages && page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const items = useMemo(
    () => (Array.isArray(tasksPage?.data) ? tasksPage.data : []).map((t: any) => taskToMapItem(t, { statusLabel })),
    [tasksPage]
  )
  const allCount = counts ? TABS.reduce((sum, t) => sum + (counts[t.value] ?? 0), 0) : undefined

  return (
    <IssuesMapView
      title="My Tasks Map"
      subtitle="Field tasks assigned to you"
      items={items}
      isLoading={profilePending || (!!profile && isLoading)}
      error={!profilePending && !profile ? (
        <>
          We couldn&apos;t load your profile.{" "}
          {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- a full page load drops the expired session's cached state */}
          <a href="/auth/login" className="font-semibold text-primary underline">Sign in again</a>
        </>
      ) : undefined}
      filters={[{ value: "All", label: "All", count: allCount }, ...TABS.map((t) => ({ ...t, count: counts?.[t.value] }))]}
      activeFilter={tab}
      onFilterChange={(v) => { setTab(v); setPage(1) }}
      legend={["review", "active", "resolved"]}
      page={page}
      totalPages={totalPages}
      total={tasksPage?.pagination?.total}
      onPageChange={setPage}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
      detailsLink={(item) => ({
        // My Tasks opens this task's next step on arrival: accept, submit proof, or its report.
        href: `/workforce/tasks?task=${encodeURIComponent(item.id)}`,
        label: item.status === "Completed" ? "Open in My Tasks" : item.status === "Accepted" || item.status === "In Progress" ? "Submit proof in My Tasks" : "Accept in My Tasks",
      })}
      emptyText="No tasks in this group."
      noun="tasks"
    />
  )
}
