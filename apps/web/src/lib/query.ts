import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

// Online-first with a persisted cache for offline reads (decision 7 / RF-35).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "online",
    },
  },
});

export function initQueryPersistence(): void {
  if (typeof window === "undefined") return;
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: "songbook.query-cache",
  });
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}
