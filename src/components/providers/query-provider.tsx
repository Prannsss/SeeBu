'use client';

import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createStore, get, set, del } from 'idb-keyval';
import { useState, useEffect } from 'react';

// Create a custom IndexedDB store for React Query
const idbStore = typeof window !== 'undefined' ? createStore('seebu-db', 'query-cache') : null;

// IndexedDB persister implementation
const idbPersister = {
  persistClient: async (client: any) => {
    if (!idbStore) return;
    try {
      await set('tanstack-query-cache', client, idbStore);
    } catch (error) {
      console.error('Failed to persist query cache', error);
    }
  },
  restoreClient: async () => {
    if (!idbStore) return undefined;
    try {
      return await get('tanstack-query-cache', idbStore);
    } catch (error) {
      console.error('Failed to restore query cache', error);
      return undefined;
    }
  },
  removeClient: async () => {
    if (!idbStore) return;
    try {
      await del('tanstack-query-cache', idbStore);
    } catch (error) {
      console.error('Failed to clear query cache', error);
    }
  },
};

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes stale time
            gcTime: 1000 * 60 * 60 * 24, // Keep cache for 24 hours
            refetchOnWindowFocus: true,
            networkMode: 'offlineFirst', // Prefer offline cache if disconnected
            retry: (failureCount, error: any) => {
              if (error.status === 404) return false;
              if (error.status === 401) return false;
              return failureCount < 3;
            },
          },
          mutations: {
            networkMode: 'offlineFirst', // Support mutations while offline
            retry: 3, // Retry mutations
          }
        },
      })
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ 
        persister: idbPersister,
        buster: 'v1', // Increment when breaking cache format changes occur
      }}
    >
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  );
}
