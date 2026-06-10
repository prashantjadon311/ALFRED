import { Injectable } from "@nestjs/common";
import { LlmProvider } from "../interfaces/llm-provider.interface";
import { ChatInput, ProviderChatOutput } from "../interfaces/llm.types";
import { assertProviderResponse, estimateTokens, joinUrl, normalizeProviderUsage, readJson, withoutUndefined } from "./http-provider.utils";

@Injectable()
export class OllamaProvider implements LlmProvider {
  providerType: LlmProvider["providerType"] = "ollama";
  private readonly defaultBaseUrl = "http://localhost:11434";
  private readonly defaultModel = "llama3.1";

  async chat(input: ChatInput): Promise<ProviderChatOutput> {
    const started = Date.now();
    const modelName = input.modelName ?? this.defaultModel;
    const messages = [
      ...(input.systemPrompt ? [{ role: "system", content: input.systemPrompt }] : []),
      { role: "user", content: input.prompt }
    ];
    const response = await fetch(joinUrl(input.baseUrl ?? this.defaultBaseUrl, "/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withoutUndefined({
        model: modelName,
        messages,
        stream: false,
        options: withoutUndefined({
          temperature: input.temperature,
          num_predict: input.maxTokens
        })
      }))
    });
    const json = await readJson(response);
    assertProviderResponse(response, this.providerType);
    const content = json?.message?.content ?? json?.response ?? "";
    const usage = normalizeProviderUsage({
      reportedInputTokens: json?.prompt_eval_count,
      reportedOutputTokens: json?.eval_count,
      estimatedInputText: `${input.systemPrompt ?? ""}\n${input.prompt}`,
      estimatedOutputText: content
    });
    return {
      content,
      providerType: this.providerType,
      modelName: json?.model ?? modelName,
      ...usage,
      latencyMs: Date.now() - started,
      raw: { model: json?.model, done: json?.done }
    };
  }

  async estimateTokens(input: string) {
    return estimateTokens(input);
  }

  async getModels() {
    return [{ name: this.defaultModel, contextWindow: 128000 }];
  }

  async testConnection(input: Partial<ChatInput> = {}) {
    await this.chat({ prompt: "Return only ok.", maxTokens: 8, ...input });
    return { status: "healthy" as const, message: "ollama provider reachable", checkedAt: new Date().toISOString() };
  }
}
