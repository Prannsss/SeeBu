"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetchClient } from "@/lib/api";

export interface Task {
  id: string;
  report_id: string;
  assigned_to?: string;
  delegated_to?: string;
  status: string;
  created_at: string;
  updated_at: string;
  related_report?: any;
}

export function useTasks(filters?: { assigned_to?: string; delegated_to?: string; status?: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["tasks", filters || {}];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const existingData: Task[] | undefined = queryClient.getQueryData(queryKey);
      
      let lastSyncAt = "";
      if (existingData && existingData.length > 0) {
        const latest = existingData.reduce((latestDate, current) => {
          const currentUpdate = new Date(current.updated_at).getTime();
          return currentUpdate > latestDate ? currentUpdate : latestDate;
        }, 0);
        if (latest > 0) {
          lastSyncAt = new Date(latest).toISOString();
        }
      }

      const params = new URLSearchParams();
      if (filters?.assigned_to) params.append("assigned_to", filters.assigned_to);
      if (filters?.delegated_to) params.append("delegated_to", filters.delegated_to);
      if (filters?.status) params.append("status", filters.status);
      if (lastSyncAt) params.append("updated_after", lastSyncAt);

      const data = await apiFetchClient<{ data: Task[] }>(`/api/v1/tasks?${params.toString()}`);
      const incomingTasks = data.data || [];

      if (!existingData || existingData.length === 0) {
        return incomingTasks;
      }

      const mergedMap = new Map(existingData.map(t => [t.id, t]));
      incomingTasks.forEach(task => {
        mergedMap.set(task.id, task);
      });

      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string, status: string }) => {
      return apiFetchClient(`/api/v1/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      // Optimistic update logic could go here
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, photo_urls }: { taskId: string, photo_urls?: string[] }) => {
      return apiFetchClient(`/api/v1/tasks/${taskId}/complete`, {
        method: "POST",
        body: JSON.stringify({ photo_urls }),
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status, assigned_to }: { taskId: string, status?: string, assigned_to?: string }) => {
      const payload: any = {};
      if (status) payload.status = status;
      if (assigned_to) payload.assigned_to = assigned_to;
      
      return apiFetchClient(`/api/v1/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
