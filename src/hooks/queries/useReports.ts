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
  const queryClient = useQueryClient();
  const queryKey = ["reports", filters || {}];

  return useQuery({
    queryKey,
    queryFn: async () => {
      // 1. Get existing reports from cache
      const existingData: Report[] | undefined = queryClient.getQueryData(queryKey);
      
      // 2. Find the most recent updated_at timestamp across existing reports
      let lastSyncAt = "";
      if (existingData && existingData.length > 0) {
        const latest = Math.max(...existingData.map(r => new Date(r.updated_at).getTime()));
        if (latest > 0) lastSyncAt = new Date(latest).toISOString();
      }

      // 3. Build query params
      const params = new URLSearchParams();
      if (filters?.municipality_id) params.append("municipality_id", filters.municipality_id);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.reporter_id) params.append("reporter_id", filters.reporter_id);
      if (lastSyncAt) params.append("updated_after", lastSyncAt);

      // 4. Fetch delta (or full list if it's the first time)
      const data = await apiFetchClient<{ data: Report[] }>(`/api/v1/reports?${params.toString()}`);
      const incomingReports = data.data || [];

      // 5. If no existing data, just return incoming
      if (!existingData || existingData.length === 0) {
        return incomingReports;
      }

      // 6. Merge deltas into existing data
      const mergedMap = new Map(existingData.map(r => [r.id, r]));
      
      incomingReports.forEach(report => {
        mergedMap.set(report.id, report); // Adds new or overwrites existing
      });

      // Convert back to array and sort by created_at desc
      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    // We want default stale time (5 min) but we can fetch deltas softly
  });
}

// Optimistic Mutation Example for Submitting a Report
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
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["reports"] });

      const previousReports = queryClient.getQueryData(["reports", {}]);

      queryClient.setQueryData(["reports", {}], (old: any) => {
        const optimisticReport = {
          id: `optimistic-${crypto.randomUUID()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'PENDING',
          ...newReport
        };
        return old ? [optimisticReport, ...old] : [optimisticReport];
      });

      return { previousReports };
    },
    onError: (err, newReport, context) => {
      if (context?.previousReports) {
        queryClient.setQueryData(["reports", {}], context.previousReports);
      }
    },
    onSettled: () => {
      // Trigger a real refetch
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
