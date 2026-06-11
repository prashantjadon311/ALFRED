import { ServiceUnavailableException } from "@nestjs/common";
import { NormalizedUsage } from "../interfaces/llm.types";

export function estimateTokens(input: string) {
  return Math.max(1, Math.ceil(input.length / 4));
}

function tokenCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : undefined;
}

export function normalizeProviderUsage(input: {
  reportedInputTokens?: unknown;
  reportedOutputTokens?: unknown;
  estimatedInputText: string;
  estimatedOutputText: string;
  cachedInputTokens?: unknown;
  cacheWriteInputTokens?: unknown;
  reasoningTokens?: unknown;
}): NormalizedUsage {
  const reportedInputTokens = tokenCount(input.reportedInputTokens);
  const reportedOutputTokens = tokenCount(input.reportedOutputTokens);
  const cachedInputTokens = tokenCount(input.cachedInputTokens);
  const cacheWriteInputTokens = tokenCount(input.cacheWriteInputTokens);
  const reasoningTokens = tokenCount(input.reasoningTokens);
  return {
    inputTokens: reportedInputTokens ?? estimateTokens(input.estimatedInputText),
    outputTokens: reportedOutputTokens ?? estimateTokens(input.estimatedOutputText),
    ...(cachedInputTokens !== undefined ? { cachedInputTokens } : {}),
    ...(cacheWriteInputTokens !== undefined ? { cacheWriteInputTokens } : {}),
    ...(reasoningTokens !== undefined ? { reasoningTokens } : {}),
    usageSource: reportedInputTokens !== undefined && reportedOutputTokens !== undefined ? "exact" : "estimated"
  };
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
