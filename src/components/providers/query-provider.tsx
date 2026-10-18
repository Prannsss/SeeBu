'use client';

import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider, type PersistedClient, type Persister } from '@tanstack/react-query-persist-client';
import { get, set } from 'idb-keyval';
import { useState } from 'react';
import { IDB_CACHE_KEY, getIdbStore, writeLocalSnapshot, readLocalSnapshot, clearClientCaches } from '@/lib/client-cache';

// IndexedDB is the primary store; a small localStorage snapshot is the fallback (see client-cache.ts)
const persister: Persister = {
  persistClient: async (client: PersistedClient) => {
    const store = getIdbStore();
    if (store) {
      try {
        await set(IDB_CACHE_KEY, client, store);
      } catch (error) {
        console.error('Failed to persist query cache', error);
      }
    }
    writeLocalSnapshot(client);
  },
  restoreClient: async () => {
    const store = getIdbStore();
    let client: PersistedClient | undefined;
    if (store) {
      try {
        client = await get<PersistedClient>(IDB_CACHE_KEY, store);
      } catch (error) {
        console.error('Failed to restore query cache', error);
      }
    }
    return client ?? readLocalSnapshot();
  },
  removeClient: () => clearClientCaches(),
};

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60_000,
            gcTime: 24 * 60 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            networkMode: 'offlineFirst',
            // Don't retry client errors (401/403/404/422...)
            retry: (n, e: any) => (e?.status >= 400 && e?.status < 500 ? false : n < 2),
          },
          mutations: {
            // Non-idempotent POSTs must not be replayed; the SW queues offline submissions
            retry: 0,
            networkMode: 'always',
          },
        },
      })
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        buster: 'v3', // bump to discard persisted caches whose shape changed (v3: locations stored as a raw array)
        maxAge: 24 * 60 * 60_000,
      }}
    >
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  );
}
