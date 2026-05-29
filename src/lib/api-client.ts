const MOCK_ACCESS_TOKEN = "mock-alfred-access-token";
const MOCK_REFRESH_TOKEN = "mock-alfred-refresh-token";

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

async function disabledRequest<T>(): Promise<T> {
  throw new Error("A.L.F.R.E.D. frontend is running in mock mode. Wire this client only when the backend contract is enabled.");
}

export const api = {
  get: <T>(_path: string) => disabledRequest<T>(),
  post: <T>(_path: string, _body?: unknown) => disabledRequest<T>(),
  patch: <T>(_path: string, _body?: unknown) => disabledRequest<T>(),
  delete: <T>(_path: string) => disabledRequest<T>()
};
