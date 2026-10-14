/**
 * Client-side cache storage.
 *
 * - IndexedDB (async, large quota) is the primary persister for the whole
 *   TanStack Query cache.
 * - localStorage (sync, ~5MB, blocks the main thread) only holds a small
 *   snapshot of hot, small queries (profile, locations, departments) so they
 *   survive when IndexedDB is unavailable or evicted (Safari private mode,
 *   storage pressure) and can be read synchronously. Report/task lists never
 *   go to localStorage.
 */
import type { QueryClient } from '@tanstack/react-query';
import type { PersistedClient } from '@tanstack/react-query-persist-client';
import { createStore, del, type UseStore } from 'idb-keyval';

export const IDB_CACHE_KEY = 'tanstack-query-cache';
export const LOCAL_SNAPSHOT_KEY = 'seebu:rq-snapshot';
export const LOCAL_SNAPSHOT_ROOTS = ['me', 'locations', 'departments', 'delegation-departments', 'workforce-admin-departments'];

let idbStore: UseStore | null = null;

export function getIdbStore(): UseStore | null {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return null;
  return (idbStore ??= createStore('seebu-db', 'query-cache'));
}

export function writeLocalSnapshot(client: PersistedClient): void {
  try {
    const snapshot: PersistedClient = {
      ...client,
      clientState: {
        queries: client.clientState.queries.filter((q) => LOCAL_SNAPSHOT_ROOTS.includes(String(q.queryKey[0]))),
        mutations: [],
      },
    };
    const json = JSON.stringify(snapshot);
    if (json.length > 200_000) return;
    localStorage.setItem(LOCAL_SNAPSHOT_KEY, json);
  } catch {
    // Quota exceeded / storage blocked — the IDB copy is still authoritative
  }
}

export function readLocalSnapshot(): PersistedClient | undefined {
  try {
    const raw = localStorage.getItem(LOCAL_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

/** Wipe every client-side copy of the previous user's data. */
export async function clearClientCaches(queryClient?: QueryClient): Promise<void> {
  queryClient?.clear();
  const store = getIdbStore();
  if (store) {
    try {
      await del(IDB_CACHE_KEY, store);
    } catch (error) {
      console.warn('Failed to clear IndexedDB cache', error);
    }
  }
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('seebu:'))
      .forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem('user-profile');
  } catch {
    // localStorage unavailable
  }
}
