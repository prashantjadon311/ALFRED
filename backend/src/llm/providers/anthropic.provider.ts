import { BadRequestException, Injectable } from "@nestjs/common";
import { EncryptionService } from "../../security/encryption.service";
import { LlmProvider } from "../interfaces/llm-provider.interface";
import { ChatInput, ProviderChatOutput } from "../interfaces/llm.types";
import { assertProviderResponse, estimateTokens, joinUrl, normalizeProviderUsage, readJson, withoutUndefined } from "./http-provider.utils";

@Injectable()
export class AnthropicProvider implements LlmProvider {
  providerType: LlmProvider["providerType"] = "anthropic";
  private readonly defaultBaseUrl = "https://api.anthropic.com";
  private readonly defaultModel = "claude-3-5-haiku-latest";

  constructor(private readonly encryption: EncryptionService) {}

  async chat(input: ChatInput): Promise<ProviderChatOutput> {
    const started = Date.now();
    const modelName = input.modelName ?? this.defaultModel;
    const apiKey = this.decryptRequiredApiKey(input.encryptedApiKey);
    const response = await fetch(joinUrl(input.baseUrl ?? this.defaultBaseUrl, "/v1/messages"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(withoutUndefined({
        model: modelName,
        system: input.systemPrompt,
        max_tokens: input.maxTokens ?? 1024,
        messages: [{ role: "user", content: input.prompt }]
      }))
    });
    const json = await readJson(response);
    assertProviderResponse(response, this.providerType);
    const content = Array.isArray(json?.content) ? json.content.map((part: any) => part?.text ?? "").join("") : "";
    const reportedInputTokens = typeof json?.usage?.input_tokens === "number"
      ? json.usage.input_tokens
        + (typeof json?.usage?.cache_creation_input_tokens === "number" ? json.usage.cache_creation_input_tokens : 0)
        + (typeof json?.usage?.cache_read_input_tokens === "number" ? json.usage.cache_read_input_tokens : 0)
      : undefined;
    const usage = normalizeProviderUsage({
      reportedInputTokens,
      reportedOutputTokens: json?.usage?.output_tokens,
      cacheWriteInputTokens: json?.usage?.cache_creation_input_tokens,
      cachedInputTokens: json?.usage?.cache_read_input_tokens,
      estimatedInputText: `${input.systemPrompt ?? ""}\n${input.prompt}`,
      estimatedOutputText: content
    });
    return {
      content,
      providerType: this.providerType,
      modelName: json?.model ?? modelName,
      requestedModelName: modelName,
      ...usage,
      latencyMs: Date.now() - started,
      raw: { id: json?.id, model: json?.model, usage: json?.usage }
    };
  }

  async estimateTokens(input: string) {
    return estimateTokens(input);
  }

  async getModels() {
    return [{ name: this.defaultModel, contextWindow: 200000 }];
  }

  async testConnection(input: Partial<ChatInput> = {}) {
    await this.chat({ prompt: "Return only ok.", maxTokens: 8, ...input });
    return { status: "healthy" as const, message: "anthropic provider reachable", checkedAt: new Date().toISOString() };
  }

  private decryptRequiredApiKey(encryptedApiKey?: string) {
    if (!encryptedApiKey) throw new BadRequestException("API key missing for anthropic provider");
    try {
      return this.encryption.decrypt(encryptedApiKey);
    } catch {
      throw new BadRequestException("API key missing or invalid for anthropic provider");
    }
  }
}
