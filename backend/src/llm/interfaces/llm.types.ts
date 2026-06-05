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

export interface ChatOutput {
  content: string;
  providerType: string;
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  raw?: unknown;
}

export interface ChatStreamChunk { content: string; done?: boolean; }
export interface ModelInfo { name: string; contextWindow: number; }
export interface ProviderHealth { status: "healthy" | "degraded" | "offline"; message?: string; checkedAt?: string; }
