const MOCK_ACCESS_TOKEN = "mock-alfred-access-token";
const MOCK_REFRESH_TOKEN = "mock-alfred-refresh-token";

type ApiEnvelope<T> = { data: T; meta?: Record<string, unknown> };
type RequestOptions = { method?: string; body?: unknown; timeoutMs?: number };

const DEFAULT_TIMEOUT_MS = 8000;
const inflightGets = new Map<string, Promise<unknown>>();
const getCache = new Map<string, { expiresAt: number; value: unknown }>();

export function isApiMode() {
  return process.env.NEXT_PUBLIC_API_MODE === "api";
}

function baseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("alfred_access_token");
}

export function setTokens(access = MOCK_ACCESS_TOKEN, refresh = MOCK_REFRESH_TOKEN) {
  if (typeof window === "undefined") return;
  localStorage.setItem("alfred_access_token", access);
  localStorage.setItem("alfred_refresh_token", refresh);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("alfred_access_token");
  localStorage.removeItem("alfred_refresh_token");
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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const hasBody = options.body !== undefined;
  const method = options.method ?? "GET";
  const cacheKey = `${token ?? "anon"}:${path}`;
  const ttlMs = method === "GET" ? cacheTtlForPath(path) : 0;
  if (ttlMs > 0) {
    const cached = getCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;
  }
  if (method === "GET" && inflightGets.has(cacheKey)) return inflightGets.get(cacheKey) as Promise<T>;

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const operation = fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
    signal: controller.signal
  }).then(async (response) => {
    const text = await response.text();
    let payload: any = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text ? { message: text } : null;
    }
    if (!response.ok) {
      const message = payload?.error?.message ?? payload?.message ?? `Request failed with ${response.status}`;
      throw new Error(message);
    }
    const value = (payload && typeof payload === "object" && "data" in payload ? (payload as ApiEnvelope<T>).data : payload) as T;
    if (ttlMs > 0) getCache.set(cacheKey, { expiresAt: Date.now() + ttlMs, value });
    return value;
  }).finally(() => {
    globalThis.clearTimeout(timeout);
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
