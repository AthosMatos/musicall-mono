/**
 * Platform-agnostic axios-based API client shared by web and mobile.
 * It knows nothing about React Query / DOM / React Native — callers wrap these
 * methods in TanStack Query (see decision 7 in the plan / ADR-0001).
 */

import axios, { AxiosError, type AxiosInstance } from 'axios';

export interface ApiClientConfig {
  baseUrl: string;
  /** Returns the current access token (or null). Called per request. */
  getAccessToken?: () => string | null | Promise<string | null>;
  /**
   * Called once on a 401 to obtain a fresh access token (e.g. hit /auth/refresh).
   * Return the new token to retry the request, or null to give up.
   */
  refreshAccessToken?: () => Promise<string | null>;
  /** Include credentials (httpOnly refresh cookie) — true on web. */
  withCredentials?: boolean;
  /**
   * Per-request timeout in ms (default 15000). Without one, a hung connection
   * (API mid-restart, dead socket after sleep) stalls callers forever — e.g.
   * the session restore on page load, leaving the app stuck on its splash.
   */
  timeoutMs?: number;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  /** Skip auth header (e.g. login/register). */
  anonymous?: boolean;
  /**
   * Send `body` as-is (multipart/form-data). Skips JSON serialization and lets
   * the platform set the Content-Type boundary. Also auto-detected when `body`
   * is a FormData instance.
   */
  formData?: boolean;
}

export class ApiClient {
  private readonly http: AxiosInstance;

  constructor(private readonly config: ApiClientConfig) {
    this.http = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, ''),
      withCredentials: config.withCredentials ?? false,
      timeout: config.timeoutMs ?? 15_000,
    });
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.send<T>(path, options, true);
  }

  private async send<T>(
    path: string,
    options: RequestOptions,
    allowRefresh: boolean,
  ): Promise<T> {
    const headers: Record<string, string> = {};

    if (!options.anonymous && this.config.getAccessToken) {
      const token = await this.config.getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const params = options.query
      ? Object.fromEntries(
          Object.entries(options.query).filter(([, v]) => v !== undefined),
        )
      : undefined;

    try {
      // axios JSON-serializes plain objects and passes FormData through with
      // the platform's multipart boundary, so `formData` needs no special path.
      const res = await this.http.request<T>({
        url: path,
        method: options.method ?? 'GET',
        params,
        data: options.body,
        headers,
        signal: options.signal,
      });
      return (res.data === '' ? undefined : res.data) as T;
    } catch (error) {
      if (!axios.isAxiosError(error)) throw error;

      const status = error.response?.status;
      if (
        status === 401 &&
        allowRefresh &&
        !options.anonymous &&
        this.config.refreshAccessToken
      ) {
        const refreshed = await this.config.refreshAccessToken();
        if (refreshed) return this.send<T>(path, options, false);
      }

      throw toApiError(error);
    }
  }
}

function toApiError(error: AxiosError): ApiError {
  if (error.response) {
    const body = error.response.data;
    const message =
      (body as { message?: string | string[] })?.message ??
      error.response.statusText ??
      error.message;
    return new ApiError(
      error.response.status,
      Array.isArray(message) ? message.join('; ') : message,
      body,
    );
  }
  // Network / timeout / cancel — no HTTP status.
  return new ApiError(0, error.message);
}

/**
 * Module-level client used by the generated API hooks (see `./hooks`). Each app
 * builds its own `ApiClient` (web=cookies, mobile=SecureStore) and registers it
 * once at startup via `configureApiClient`, so the generated standalone fetch
 * functions can reach the right per-app instance without taking a client arg.
 */
let configuredClient: ApiClient | null = null;

export function configureApiClient(client: ApiClient): void {
  configuredClient = client;
}

export interface ApiRequestArgs {
  method: RequestOptions['method'];
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
  formData?: boolean;
}

/** Adapter invoked by every generated hook. Delegates to the configured client. */
export async function apiRequest<T>(args: ApiRequestArgs): Promise<T> {
  if (!configuredClient) {
    throw new Error(
      'API client not configured: call configureApiClient() at startup',
    );
  }
  return configuredClient.request<T>(args.path, {
    method: args.method,
    query: args.query as RequestOptions['query'],
    body: args.body,
    formData: args.formData,
  });
}
