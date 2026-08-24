"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetchClient } from "@/lib/api";

export interface Task {
  id: string;
  title: string;
  location: string;
  priority: string;
  status: string;
  assigned_to?: string | null;
  delegated_to?: string | null;
  related_report_id?: string | null;
  created_at: string;
  completed_at?: string | null;
  related_report?: any;
}

export function useTasks(filters?: { assigned_to?: string; delegated_to?: string; status?: string }) {
  const queryKey = ["tasks", filters || {}];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.assigned_to) params.append("assigned_to", filters.assigned_to);
      if (filters?.delegated_to) params.append("delegated_to", filters.delegated_to);
      if (filters?.status) params.append("status", filters.status);

      const data = await apiFetchClient<{ data: Task[] }>(`/api/v1/tasks?${params.toString()}`);
      return data.data || [];
    },
    refetchInterval: 5000, // 5s fallback polling ensuring near-instant sync alongside Supabase realtime
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string, status: string }) => {
      return apiFetchClient(`/api/v1/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["workforce-admin-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["workforce-admin-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
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
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["workforce-admin-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
