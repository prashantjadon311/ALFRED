const MOCK_ACCESS_TOKEN = "mock-alfred-access-token";
const MOCK_REFRESH_TOKEN = "mock-alfred-refresh-token";

type ApiEnvelope<T> = { data: T; meta?: Record<string, unknown> };
type RequestOptions = { method?: string; body?: unknown };

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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const hasBody = options.body !== undefined;
  const response = await fetch(`${baseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: hasBody ? JSON.stringify(options.body) : undefined
  });
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
  return (payload && typeof payload === "object" && "data" in payload ? (payload as ApiEnvelope<T>).data : payload) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" })
};
