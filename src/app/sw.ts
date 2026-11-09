import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist, CacheFirst, NetworkOnly } from "serwist";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

// SeeBu does not work offline: the service worker only caches the app's static files so it
// loads faster and can be installed. Every action, including completing a task, needs a
// connection; nothing is queued for later replay.
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
  ],
});

serwist.addEventListeners();
