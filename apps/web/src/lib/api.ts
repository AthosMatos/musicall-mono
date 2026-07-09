import type { AuthTokens } from "@monorepo/core";
import { ApiClient, configureApiClient } from "@monorepo/core/api";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Access token lives in memory; the refresh token is an httpOnly cookie set by
// the API, so the browser sends it automatically with credentials (decision 3).
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// Refresh tokens are single-use (the API rotates them), so two concurrent
// refreshes would revoke each other. Collapse overlapping calls onto one
// in-flight promise — this covers React StrictMode's double-mounted restore
// effect in dev and any burst of 401s that all trigger a refresh at once.
let refreshInFlight: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  try {
    const tokens = await api.request<AuthTokens>("/api/auth/refresh", {
      method: "POST",
      anonymous: true,
    });
    accessToken = tokens.accessToken;
    return tokens.accessToken;
  } catch {
    accessToken = null;
    return null;
  }
}

/** Restore/rotate the session, sharing a single request across concurrent callers. */
export function refreshSession(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export const api: ApiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  withCredentials: true,
  getAccessToken: () => accessToken,
  refreshAccessToken: refreshSession,
});

// Register this instance so the generated hooks (`@monorepo/core/api`) use it.
configureApiClient(api);
