export function maskApiKey(apiKey: string) {
  if (!apiKey) return "";
  if (apiKey === "local-only") return apiKey;
  const clean = apiKey.trim();
  if (clean.length <= 8) return `${clean.slice(0, 2)}••••`;
  return `${clean.slice(0, 6)}••••••••••••${clean.slice(-4)}`;
}
