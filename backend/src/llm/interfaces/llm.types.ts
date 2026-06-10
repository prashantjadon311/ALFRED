export interface ChatInput {
  prompt: string;
  systemPrompt?: string;
  providerType?: string;
  modelName?: string;
  userId?: string;
  baseUrl?: string;
  encryptedApiKey?: string;
  temperature?: number;
  maxTokens?: number;
  nodeKey?: string;
  iteration?: number;
  context?: unknown;
}

export interface NormalizedUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  reasoningTokens?: number;
  usageSource: "exact" | "estimated";
}

export interface ProviderChatOutput extends NormalizedUsage {
  content: string;
  providerType: string;
  modelName: string;
  latencyMs: number;
  raw?: unknown;
}

export interface ChatOutput extends ProviderChatOutput {
  costUsd: number;
  pricingSnapshotId?: string;
  costSource: "exact" | "estimated" | "unavailable";
  calculatedAt: Date;
}

export interface ChatStreamChunk { content: string; done?: boolean; }
export interface ModelInfo { name: string; contextWindow: number; }
export interface ProviderHealth { status: "healthy" | "degraded" | "offline"; message?: string; checkedAt?: string; }
