import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist, CacheFirst, NetworkOnly, BackgroundSyncPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

const bgSyncPlugin = new BackgroundSyncPlugin("offline-mutations-queue", {
  maxRetentionTime: 24 * 60, // Retry for 24 Hours
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
    {
      matcher: ({ request, url }) => {
        // Intercept mutation APIs (POST, PUT, PATCH, DELETE)
        return ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && url.pathname.includes("/api/");
      },
      handler: new NetworkOnly({
        plugins: [bgSyncPlugin],
      }),
    }
  ],
});

serwist.addEventListeners();
