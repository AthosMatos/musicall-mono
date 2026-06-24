/**
 * Platform-agnostic fetch-based API client shared by web and mobile.
 * It knows nothing about React Query / DOM / React Native — callers wrap these
 * methods in TanStack Query (see decision 7 in the plan / ADR-0001).
 */

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
  constructor(private readonly config: ApiClientConfig) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.send<T>(path, options, true);
  }

  private async send<T>(
    path: string,
    options: RequestOptions,
    allowRefresh: boolean,
  ): Promise<T> {
    const url = this.buildUrl(path, options.query);
    const headers: Record<string, string> = {};
    let bodyInit: BodyInit | undefined;

    if (options.body !== undefined) {
      const isFormData =
        options.formData ||
        (typeof FormData !== 'undefined' && options.body instanceof FormData);
      if (isFormData) {
        // Pass through untouched; the platform sets the multipart boundary.
        bodyInit = options.body as BodyInit;
      } else {
        headers['Content-Type'] = 'application/json';
        bodyInit = JSON.stringify(options.body);
      }
    }

    if (!options.anonymous && this.config.getAccessToken) {
      const token = await this.config.getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: bodyInit,
      signal: options.signal,
      credentials: this.config.withCredentials ? 'include' : 'same-origin',
    });

    if (
      res.status === 401 &&
      allowRefresh &&
      !options.anonymous &&
      this.config.refreshAccessToken
    ) {
      const refreshed = await this.config.refreshAccessToken();
      if (refreshed) return this.send<T>(path, options, false);
    }

    if (!res.ok) {
      const errorBody = await this.safeJson(res);
      throw new ApiError(
        res.status,
        (errorBody as { message?: string })?.message ?? res.statusText,
        errorBody,
      );
    }

    if (res.status === 204) return undefined as T;
    return (await this.safeJson(res)) as T;
  }

  private buildUrl(
    path: string,
    query?: RequestOptions['query'],
  ): string {
    const base = this.config.baseUrl.replace(/\/$/, '');
    const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private async safeJson(res: Response): Promise<unknown> {
    const text = await res.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
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
