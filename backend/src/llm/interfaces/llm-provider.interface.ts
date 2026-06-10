import { ChatInput, ChatStreamChunk, ModelInfo, ProviderChatOutput, ProviderHealth } from "./llm.types";

export interface LlmProvider {
  providerType: "mock" | "openai" | "anthropic" | "gemini" | "ollama" | "openrouter" | "groq" | "together" | "custom_openai_compatible";
  chat(input: ChatInput): Promise<ProviderChatOutput>;
  stream?(input: ChatInput): AsyncIterable<ChatStreamChunk>;
  estimateTokens(input: string): Promise<number>;
  getModels(): Promise<ModelInfo[]>;
  testConnection(input?: Partial<ChatInput>): Promise<ProviderHealth>;
}
