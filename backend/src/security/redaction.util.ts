export function redactSecrets<T>(value: T): T {
  if (value === undefined || value === null) return value;
  const text = JSON.stringify(value, (_key, val) => {
    if (typeof val === "string" && /(sk-|api[_-]?key|secret|token)/i.test(val)) return "[REDACTED]";
    return val;
  });
  return JSON.parse(text) as T;
}

export const redactPaths = [
  "req.headers.authorization",
  "request.headers.authorization",
  "*.password",
  "*.passwordHash",
  "*.refreshToken",
  "*.refreshTokenHash",
  "*.apiKey",
  "*.encryptedApiKey",
  "*.accessToken",
  "*.refreshToken"
];
