"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const res = await apiClient.users.me();
        const data = res.data ?? null;
        if (data) {
          try {
            localStorage.setItem("user-profile", JSON.stringify(data));
          } catch {
            // localStorage unavailable
          }
        }
        return data;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}
