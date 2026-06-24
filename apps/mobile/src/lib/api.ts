import { ApiClient, configureApiClient, type AuthTokens } from "@monorepo/core";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

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
      const tokens = await api.request<AuthTokens>("/auth/refresh", {
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
