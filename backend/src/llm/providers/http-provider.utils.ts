import { ServiceUnavailableException } from "@nestjs/common";

export function estimateTokens(input: string) {
  return Math.max(1, Math.ceil(input.length / 4));
}

export function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export function withoutUndefined(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

export async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export function assertProviderResponse(response: Response, providerType: string) {
  if (!response.ok) {
    throw new ServiceUnavailableException(`${providerType} provider request failed with status ${response.status}`);
  }
}
