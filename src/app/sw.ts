import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist, CacheFirst, NetworkOnly, BackgroundSyncPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis & {
  clients: { matchAll(options?: { includeUncontrolled?: boolean }): Promise<{ postMessage(message: unknown): void }[]> };
};

const bgSyncPlugin = new BackgroundSyncPlugin("offline-mutations-queue", {
  maxRetentionTime: 24 * 60, // Retry for 24 Hours
  // The default replay treats any HTTP response as delivered. Keep 5xx/429 queued for the
  // next sync and tell open tabs about other failures (GooeyToasterProvider shows a toast).
  // Note: a 504 can arrive after the backend already created the report, so a retry may duplicate it.
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      let res: Response;
      try {
        res = await fetch(entry.request.clone());
      } catch {
        await queue.unshiftRequest(entry);
        throw new Error("replay-network");
      }
      if (res.status >= 500 || res.status === 429) {
        await queue.unshiftRequest(entry);
        throw new Error("replay-retry");
      }
      if (!res.ok) {
        const message = { type: "BG_SYNC_FAILED", url: entry.request.url, status: res.status };
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        clients.forEach((c) => c.postMessage(message));
      }
    }
  },
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Navigation requests (HTML page loads / RSC route transitions) MUST always
    // go to the network so the Next.js middleware can enforce auth/role redirects
    // with the latest cookies. If we let the SW cache these, a stale
    // "302 → /auth/login" or "302 → /forbidden" from a previous unauthenticated
    // visit gets served to a freshly-logged-in user on mobile.
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkOnly(),
    },
    ...defaultCache,
    // Add custom offline fallback or image cache logic
    {
      matcher: ({ request }) => request.destination === "image",
      handler: new CacheFirst({
        cacheName: "offline-images",
        plugins: [],
      }),
    },
    // Only report submission and task completion are queued for background sync.
    // The page still receives a network error for a queued request, so the UI shows a
    // "queued offline" message (isOfflineQueuedError from '@/lib/api'); backend
    // completeTask returns 409 when a replay hits an already-completed task.
    {
      matcher: ({ request, url }) =>
        request.method === "POST" &&
        url.origin === self.location.origin &&
        (url.pathname === "/api/proxy/reports" || /^\/api\/proxy\/tasks\/[^/]+\/complete$/.test(url.pathname)),
      handler: new NetworkOnly({
        plugins: [bgSyncPlugin],
      }),
      method: "POST",
    }
  ],
});

serwist.addEventListeners();
