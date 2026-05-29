import type { Message, ModelConfig } from "./types";

export function estimateMessageCost(message: Pick<Message, "tokens" | "cost">) {
  return message.cost || message.tokens * 0.00001;
}

export function estimateTokensCost(inputTokens: number, outputTokens: number, model: ModelConfig) {
  return (inputTokens / 1_000_000) * model.inputCost + (outputTokens / 1_000_000) * model.outputCost;
}
