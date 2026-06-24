import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { loadStoredAccessToken } from "@/lib/api";
import { initQueryPersistence, queryClient } from "@/lib/query";

export default function RootLayout() {
  useEffect(() => {
    initQueryPersistence();
    void loadStoredAccessToken();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack />
    </QueryClientProvider>
  );
}
