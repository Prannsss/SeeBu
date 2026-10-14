"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetchClient } from "@/lib/api";

export interface Report {
  id: string;
  title: string;
  description: string;
  urgency: string;
  status: string;
  location: string;
  landmark: string;
  municipality_id: string;
  barangay_id: string;
  reporter_id: string;
  created_at: string;
  updated_at: string;
  municipalities?: { name: string };
  barangays?: { name: string };
  report_photos?: { photo_url: string; is_completion_photo: boolean }[];
}

export function useReports(filters?: { municipality_id?: string; status?: string; reporter_id?: string }) {
  return useQuery({
    queryKey: ["reports", filters || {}],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.municipality_id) params.append("municipality_id", filters.municipality_id);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.reporter_id) params.append("reporter_id", filters.reporter_id);

      const data = await apiFetchClient<{ data: Report[] }>(`/api/v1/reports?${params.toString()}`);
      return data.data || [];
    },
  });
}

// Optimistic mutation for submitting a report
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newReport: any) => {
      return apiFetchClient(`/api/v1/reports`, {
        method: "POST",
        body: JSON.stringify(newReport),
      });
    },
    onMutate: async (newReport) => {
      await queryClient.cancelQueries({ queryKey: ["reports"] });
      const previous = queryClient.getQueriesData({ queryKey: ["reports"] });

      const optimistic = {
        id: `optimistic-${crypto.randomUUID()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "PENDING",
        ...newReport,
      };
      queryClient.setQueriesData({ queryKey: ["reports"] }, (old: any) => (Array.isArray(old) ? [optimistic, ...old] : old));

      return { previous };
    },
    onError: (_err, _newReport, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["client-reports"] });
    },
  });
}
