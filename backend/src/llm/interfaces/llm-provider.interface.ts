import { ChatInput, ChatOutput, ChatStreamChunk, ModelInfo, ProviderHealth } from "./llm.types";

export interface LlmProvider {
  providerType: "mock" | "openai" | "anthropic" | "gemini" | "ollama" | "openrouter" | "groq" | "together" | "custom_openai_compatible";
  chat(input: ChatInput): Promise<ChatOutput>;
  stream?(input: ChatInput): AsyncIterable<ChatStreamChunk>;
  estimateTokens(input: string): Promise<number>;
  getModels(): Promise<ModelInfo[]>;
  testConnection(): Promise<ProviderHealth>;
}
