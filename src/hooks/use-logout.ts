"use client";

import { useQueryClient } from "@tanstack/react-query";
import { logoutUser } from "@/app/actions/user.actions";
import { del } from "idb-keyval";
import { useRouter } from "next/navigation";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleLogout = async () => {
    // 1. Clear in-memory React Query cache
    queryClient.clear();
    
    // 2. Clear IndexedDB persistent cache securely
    try {
      await del("tanstack-query-cache");
    } catch (error) {
      console.warn("Failed to clear IndexedDB cache", error);
    }
    
    // 3. Clear session storage
    if (typeof window !== "undefined") {
      sessionStorage.clear();
      localStorage.clear();
    }

    // 4. Server-side logout (clears HTTP-only cookies)
    await logoutUser();

    // 5. Hard redirect to home to flush all state
    window.location.href = "/";
  };

  return handleLogout;
}