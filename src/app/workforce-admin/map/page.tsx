"use client"

import { useEffect, useMemo, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { IssuesMapView } from "@/components/map/IssuesMapView"
import { taskToMapItem } from "@/components/map/mappers"
import { useCurrentUser } from "@/hooks/queries/useCurrentUser"
import { useRealtimeReports } from "@/hooks/useRealtimeReports"

const PAGE_SIZE = 50 // backend max
const TABS = ["Pending", "Assigned", "Completed"] as const

// Officers "accept" a task when they start the field work.
const statusLabel = (status: string) => (status === "Accepted" ? "In Progress" : status)

export default function WorkforceAdminMapPage() {
  const { data: profile, isPending: profilePending } = useCurrentUser()
  useRealtimeReports({ enableToasts: true, userRole: "workforce-admin", userId: profile?.id })
  const [tab, setTab] = useState("Pending")
  const [page, setPage] = useState(1)
  const departmentId = profile?.department_id ? String(profile.department_id) : ""

  // Same keys as the Tasks page, so both share cache and realtime refreshes.
  const { data: officersData } = useQuery({
    queryKey: ["workforce-admin-officers", departmentId],
    queryFn: async () => {
      const { apiClient } = await import("@/lib/api")
      return (await apiClient.departments.getPersonnel(departmentId)).data || []
    },
    enabled: !!departmentId,
  })
  const officerName = useMemo(() => {
    const byId = new Map<string, string>()
    for (const p of Array.isArray(officersData) ? officersData : []) {
      if (p.role === "workforce") byId.set(p.id, p.officer_role ? `${p.full_name} (${p.officer_role})` : p.full_name)
    }
    return byId
  }, [officersData])

  const { data: tasksPage, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["workforce-admin-tasks", departmentId, "map", tab, page],
    queryFn: async () => {
      const { apiClient } = await import("@/lib/api")
      return apiClient.tasks.getAll({ delegated_to: departmentId, tab: tab === "All" ? undefined : tab, page, page_size: PAGE_SIZE })
    },
    enabled: !!departmentId,
  })

  const { data: counts } = useQuery({
    queryKey: ["workforce-admin-tasks", departmentId, "counts"],
    queryFn: async () => {
      const { apiClient } = await import("@/lib/api")
      const json = await apiClient.tasks.getAll({ delegated_to: departmentId, page: 1, page_size: 1, count_tabs: true })
      return json.counts as Record<string, number> | undefined
    },
    placeholderData: keepPreviousData,
    enabled: !!departmentId,
  })

  const totalPages: number | undefined = tasksPage?.pagination?.total_pages
  useEffect(() => {
    if (totalPages && page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const items = useMemo(
    () =>
      (Array.isArray(tasksPage?.data) ? tasksPage.data : []).map((t: any) =>
        taskToMapItem(t, {
          statusLabel,
          meta: (task) => [{ label: "Assigned to", value: task.assigned_to ? officerName.get(task.assigned_to) || "Officer" : "Not yet assigned" }],
        })
      ),
    [tasksPage, officerName]
  )
  const unassignedIds = useMemo(
    () => new Set((Array.isArray(tasksPage?.data) ? tasksPage.data : []).filter((t: any) => !t.assigned_to && t.status !== "Completed").map((t: any) => t.id as string)),
    [tasksPage]
  )
  const allCount = counts ? TABS.reduce((sum, t) => sum + (counts[t] ?? 0), 0) : undefined

  return (
    <IssuesMapView
      title="Department Tasks Map"
      subtitle={profile?.department_name || "Your department"}
      items={items}
      isLoading={profilePending || (!!departmentId && isLoading)}
      error={!profilePending && !departmentId ? "Your account isn't linked to a department yet." : undefined}
      filters={[{ value: "All", label: "All", count: allCount }, ...TABS.map((t) => ({ value: t, label: t, count: counts?.[t] }))]}
      activeFilter={tab}
      onFilterChange={(v) => { setTab(v); setPage(1) }}
      legend={["review", "active", "resolved"]}
      page={page}
      totalPages={totalPages}
      total={tasksPage?.pagination?.total}
      onPageChange={setPage}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
      detailsLink={(item) => {
        // The Tasks page opens this task's modal on arrival: officer selection if it's unassigned.
        const assign = unassignedIds.has(item.id)
        return {
          href: `/workforce-admin/tasks?task=${encodeURIComponent(item.id)}&action=${assign ? "assign" : "view"}`,
          label: assign ? "Assign in Tasks" : "Open in Tasks",
        }
      }}
      emptyText="No department tasks in this group."
      noun="tasks"
    />
  )
}
