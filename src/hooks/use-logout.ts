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

    // 5. Purge service-worker runtime caches so stale auth redirects
    //    (e.g., an old "302 → /auth/login" for /client/report) don't survive
    //    into the next user's session on mobile PWA.
    if (typeof window !== "undefined" && "caches" in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      } catch {
        // Non-critical — ignore if the Caches API is unavailable
      }
    }

    // 6. Hard redirect to home to flush all state
    window.location.href = "/";
  };

  return handleLogout;
}