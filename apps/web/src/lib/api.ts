import { ApiClient, configureApiClient, type AuthTokens } from "@monorepo/core";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Access token lives in memory; the refresh token is an httpOnly cookie set by
// the API, so the browser sends it automatically with credentials (decision 3).
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export const api: ApiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  withCredentials: true,
  getAccessToken: () => accessToken,
  refreshAccessToken: async () => {
    try {
      const tokens = await api.request<AuthTokens>("/auth/refresh", {
        method: "POST",
        anonymous: true,
      });
      accessToken = tokens.accessToken;
      return tokens.accessToken;
    } catch {
      accessToken = null;
      return null;
    }
  },
});

// Register this instance so the generated hooks (`@monorepo/core/api`) use it.
configureApiClient(api);
