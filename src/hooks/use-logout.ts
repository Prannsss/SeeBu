"use client";

import { useQueryClient } from "@tanstack/react-query";
import { logoutUser } from "@/app/actions/user.actions";
import { clearClientCaches } from "@/lib/client-cache";

export function useLogout(redirectTo = "/") {
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    // 1. Clear in-memory query cache, IndexedDB store and 'seebu:' localStorage snapshot
    await clearClientCaches(queryClient);

    // 2. Clear remaining web storage
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {
      // Storage unavailable
    }

    // 3. Server-side logout (clears HTTP-only cookies)
    await logoutUser();

    // 4. Purge service-worker runtime caches so stale auth redirects
    //    (e.g., an old "302 → /auth/login" for /client/report) don't survive
    //    into the next user's session on mobile PWA.
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      } catch {
        // Non-critical — ignore if the Caches API is unavailable
      }
    }

    // 5. Hard redirect to flush all state
    window.location.href = redirectTo;
  };

  return handleLogout;
}
