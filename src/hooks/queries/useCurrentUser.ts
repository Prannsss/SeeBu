"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const res = await apiClient.users.me();
        return res.data ?? null;
      } catch {
        return null;
      }
    },
    retry: false,
  });
}
