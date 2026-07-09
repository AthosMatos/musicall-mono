import type { AuthTokens } from "@monorepo/core";
import { ApiClient, configureApiClient } from "@monorepo/core/api";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const API_PORT = 3000;

/**
 * Resolve the API base URL. On a device/emulator `localhost` points at the
 * device itself, not the dev machine — so in development we derive the host
 * from the Metro/Expo dev server (its LAN address), which both emulators and
 * physical devices can reach. `EXPO_PUBLIC_API_URL` always wins (use it in
 * production and for custom setups).
 */
function resolveApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit;

  // e.g. "192.168.0.12:8081" — the machine running Metro.
  const hostUri =
    Constants.expoConfig?.hostUri ??
    // @ts-expect-error debuggerHost exists on the classic manifest shape
    (Constants.manifest?.debuggerHost as string | undefined);
  const host = hostUri?.split(":")[0];
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:${API_PORT}`;
  }

  // Fallbacks when the dev host can't be determined.
  if (Platform.OS === "android") return `http://10.0.2.2:${API_PORT}`; // emulator → host loopback
  return `http://localhost:${API_PORT}`; // iOS simulator / web
}

const API_BASE_URL = resolveApiBaseUrl();

if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log(`[api] base URL: ${API_BASE_URL}`);
}

const ACCESS_KEY = "songbook.accessToken";
const REFRESH_KEY = "songbook.refreshToken";

// In-memory access token; refresh token lives in the OS keychain (decision 3).
let accessToken: string | null = null;

export async function loadStoredAccessToken(): Promise<void> {
  accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
}

export async function setTokens(tokens: AuthTokens): Promise<void> {
  accessToken = tokens.accessToken;
  await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
  }
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export const api: ApiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  withCredentials: false, // mobile carries the refresh token explicitly
  getAccessToken: () => accessToken,
  refreshAccessToken: async () => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!refreshToken) return null;
    try {
      const tokens = await api.request<AuthTokens>("/api/auth/refresh", {
        method: "POST",
        body: { refreshToken },
        anonymous: true,
      });
      await setTokens(tokens);
      return tokens.accessToken;
    } catch {
      await clearTokens();
      return null;
    }
  },
});

// Register this instance so the generated hooks (`@monorepo/core/api`) use it.
configureApiClient(api);
