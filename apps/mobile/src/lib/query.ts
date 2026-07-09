import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import {
  type Persister,
  persistQueryClient,
} from "@tanstack/react-query-persist-client";

// Online-first with persisted cache for offline reads (decision 7 / RF-35).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      // Keep cached data readable offline; mutations remain online-only.
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "online",
    },
  },
});

const asyncStoragePersister: Persister = {
  persistClient: async (client) => {
    await AsyncStorage.setItem("musicall.query-cache", JSON.stringify(client));
  },
  restoreClient: async () => {
    const cache = await AsyncStorage.getItem("musicall.query-cache");
    return cache ? JSON.parse(cache) : undefined;
  },
  removeClient: async () => {
    await AsyncStorage.removeItem("musicall.query-cache");
  },
};

export function initQueryPersistence(): void {
  persistQueryClient({
    queryClient,
    persister: asyncStoragePersister,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}
