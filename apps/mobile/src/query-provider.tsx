import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient, type Persister } from "@tanstack/react-query-persist-client";
import { queryClientAtom } from "jotai-tanstack-query";
import { useHydrateAtoms } from "jotai/react/utils";
import type { PropsWithChildren } from "react";


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

function HydrateAtoms({
	children,
	queryClient,
}: PropsWithChildren<{
	queryClient: QueryClient;
}>) {
	useHydrateAtoms(new Map([[queryClientAtom, queryClient]]));
	return <>{children}</>;
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutos
			gcTime: 1000 * 60 * 10, // 10 minutos
			retry: 1,
			refetchOnWindowFocus: false,// Keep cached data readable offline; mutations remain online-only.
			networkMode: "offlineFirst",
		},
		mutations: {
			networkMode: "online",
			retry: 1,
		},
	},
});

export function QueryProvider({ children }: PropsWithChildren) {
	return (
		<QueryClientProvider client={queryClient}>
			<HydrateAtoms queryClient={queryClient}>{children}</HydrateAtoms>
		</QueryClientProvider>
	);
}
