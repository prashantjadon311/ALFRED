type RefreshCookieSameSite = "strict" | "lax" | "none";

function refreshCookieSameSite(): RefreshCookieSameSite {
  const value = process.env.AUTH_REFRESH_COOKIE_SAME_SITE?.trim().toLowerCase();
  if (value === "strict" || value === "lax" || value === "none") return value;
  return process.env.NODE_ENV === "production" ? "strict" : "lax";
}

function refreshCookieSecure() {
  const value = process.env.AUTH_REFRESH_COOKIE_SECURE?.trim().toLowerCase();
  if (value !== undefined) return value === "true";
  return process.env.NODE_ENV === "production";
}

export const authConfig = () => {
  const refreshCookieDomain = process.env.AUTH_REFRESH_COOKIE_DOMAIN?.trim() || undefined;
  return {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "change_me_access",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "change_me_refresh",
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL ?? "7d",
    refreshCookieName: process.env.AUTH_REFRESH_COOKIE_NAME ?? "alfred_refresh_token",
    refreshCookiePath: process.env.AUTH_REFRESH_COOKIE_PATH ?? "/auth",
    refreshCookieDomain,
    refreshCookieSameSite: refreshCookieSameSite(),
    refreshCookieSecure: refreshCookieSecure()
  };
};
