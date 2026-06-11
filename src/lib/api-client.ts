"use client";

type ApiEnvelope<T> = { data: T; meta?: Record<string, unknown> };
type RequestOptions = { method?: string; body?: unknown; timeoutMs?: number };

const DEFAULT_TIMEOUT_MS = 8000;
const REFRESH_TIMEOUT_MS = 8000;
const STALE_REFRESH_RETRY_DELAY_MS = 150;
const inflightGets = new Map<string, Promise<unknown>>();
const getCache = new Map<string, { expiresAt: number; value: unknown }>();
const WORKSPACE_STORAGE_KEY = "alfred_workspaces_state";
const NO_REFRESH_PATHS = new Set(["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"]);

let accessToken: string | null = null;
let authGeneration = 0;
let refreshPromise: Promise<{ user: unknown; accessToken: string }> | null = null;

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly payload?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

function errorCode(error: unknown) {
  if (!(error instanceof ApiError)) return undefined;

  const payload = error.payload as
    | { error?: { code?: unknown } }
    | undefined;

  return typeof payload?.error?.code === "string"
    ? payload.error.code
    : undefined;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

export function isApiMode() {
  return process.env.NEXT_PUBLIC_API_MODE === "api";
}

function baseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string) {
  accessToken = token;
  authGeneration += 1;
  clearGetCache();
}

export function clearAccessToken() {
  accessToken = null;
  authGeneration += 1;
  clearGetCache();
}

function dispatchAuthExpired() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("alfred:auth-expired"));
}

function getActiveWorkspaceId(): string | null {
  if (!isApiMode() || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { activeWorkspaceId?: unknown };
    return typeof parsed.activeWorkspaceId === "string" && /^[a-f\d]{24}$/i.test(parsed.activeWorkspaceId) ? parsed.activeWorkspaceId : null;
  } catch {
    return null;
  }
}

function cacheTtlForPath(path: string) {
  if (path === "/dashboard/summary" || path === "/usage/summary") return 10_000;
  if (path.startsWith("/usage/daily") || path.startsWith("/usage/by-provider")) return 10_000;
  if (path === "/model-providers" || path === "/models") return 30_000;
  return 0;
}

function clearGetCache() {
  getCache.clear();
  inflightGets.clear();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text ? { message: text } : null;
  }
  if (!response.ok) {
    const message = payload?.error?.message ?? payload?.message ?? `Request failed with ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }
  return (payload && typeof payload === "object" && "data" in payload ? (payload as ApiEnvelope<T>).data : payload) as T;
}

async function requestRefreshOnce() {
  const controller = new AbortController();

  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    REFRESH_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${baseUrl()}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      signal: controller.signal
    });

    const data = await parseResponse<{
      user: unknown;
      accessToken: string;
    }>(response);

    setAccessToken(data.accessToken);
    return data;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export async function refreshAccessToken() {
  if (typeof window === "undefined") {
    throw new ApiError(
      "Browser authentication runtime required",
      0
    );
  }

  if (!isApiMode()) {
    throw new ApiError(
      "Refresh is unavailable in mock mode",
      400
    );
  }

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      try {
        return await requestRefreshOnce();
      } catch (error) {
        if (errorCode(error) !== "REFRESH_TOKEN_STALE") {
          throw error;
        }

        // Another tab/request may have rotated the shared cookie.
        await delay(STALE_REFRESH_RETRY_DELAY_MS);
        return requestRefreshOnce();
      }
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        clearAccessToken();
        dispatchAuthExpired();
      }

      if (error instanceof ApiError) throw error;

      throw new ApiError(
        error instanceof Error
          ? error.message
          : "Session refresh failed",
        0,
        error
      );
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function executeOnce<T>(path: string, options: RequestOptions) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const workspaceId = getActiveWorkspaceId();
  const hasBody = options.body !== undefined;
  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(workspaceId ? { "X-Workspace-Id": workspaceId } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
    return await parseResponse<T>(response);
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function executeWithRefresh<T>(path: string, options: RequestOptions, retried = false): Promise<T> {
  try {
    return await executeOnce<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && !retried && !NO_REFRESH_PATHS.has(path)) {
      await refreshAccessToken();
      return executeWithRefresh<T>(path, options, true);
    }
    if (error instanceof ApiError && error.status === 401 && retried) {
      clearAccessToken();
      dispatchAuthExpired();
    }
    throw error;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (path === "/auth/logout" && refreshPromise) {
    try {
      await refreshPromise;
    } catch {
      // Logout still clears the browser cookie after a failed refresh.
    }
  }
  const workspaceId = getActiveWorkspaceId();
  const method = options.method ?? "GET";
  const cacheKey = `${authGeneration}:${workspaceId ?? "no-workspace"}:${path}`;
  const ttlMs = method === "GET" ? cacheTtlForPath(path) : 0;
  if (ttlMs > 0) {
    const cached = getCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;
  }
  if (method === "GET" && inflightGets.has(cacheKey)) return inflightGets.get(cacheKey) as Promise<T>;

  const operation = executeWithRefresh<T>(path, options).then((value) => {
    if (ttlMs > 0) getCache.set(cacheKey, { expiresAt: Date.now() + ttlMs, value });
    return value;
  }).finally(() => {
    if (method === "GET") inflightGets.delete(cacheKey);
  });

  if (method === "GET") inflightGets.set(cacheKey, operation);
  if (method !== "GET") clearGetCache();
  return operation;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" })
};
