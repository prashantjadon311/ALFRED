const MIN_SECRET_LENGTH = 32;

const defaultSecrets = new Set([
  "change_me_access",
  "change_me_refresh",
  "change_this_32_byte_key_value"
]);

type Env = Record<string, string | undefined>;

function isWeakSecret(value: string | undefined) {
  if (!value) return true;
  const normalized = value.trim();
  return normalized.length < MIN_SECRET_LENGTH || defaultSecrets.has(normalized) || /^change[_-]?me/i.test(normalized);
}

export function assertProductionSecrets(env: Env = process.env) {
  if ((env.NODE_ENV ?? "development") !== "production") return;

  const failures: string[] = [];
  if (isWeakSecret(env.JWT_ACCESS_SECRET)) failures.push("JWT_ACCESS_SECRET");
  if (isWeakSecret(env.JWT_REFRESH_SECRET)) failures.push("JWT_REFRESH_SECRET");
  if (isWeakSecret(env.ENCRYPTION_KEY)) failures.push("ENCRYPTION_KEY");
  if (!env.FRONTEND_URLS?.trim() && !env.FRONTEND_URL?.trim()) failures.push("FRONTEND_URL or FRONTEND_URLS");
  if (env.AUTH_REFRESH_COOKIE_SAME_SITE?.trim().toLowerCase() === "none" && env.AUTH_REFRESH_COOKIE_SECURE?.trim().toLowerCase() === "false") {
    failures.push("AUTH_REFRESH_COOKIE_SECURE");
  }

  if (failures.length) {
    throw new Error(`Production configuration is unsafe: ${failures.join(", ")} must be set to non-default values.`);
  }
}
