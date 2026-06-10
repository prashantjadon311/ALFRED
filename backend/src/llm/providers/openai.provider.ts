import { BadRequestException, Injectable } from "@nestjs/common";
import { EncryptionService } from "../../security/encryption.service";
import { LlmProvider } from "../interfaces/llm-provider.interface";
import { ChatInput, ProviderChatOutput } from "../interfaces/llm.types";
import { assertProviderResponse, estimateTokens, joinUrl, normalizeProviderUsage, readJson, withoutUndefined } from "./http-provider.utils";

@Injectable()
export class OpenAiProvider implements LlmProvider {
  providerType: LlmProvider["providerType"] = "openai";
  protected readonly defaultBaseUrl: string = "https://api.openai.com/v1";
  protected readonly defaultModel: string = "gpt-4o-mini";

  constructor(protected readonly encryption: EncryptionService) {}

  async chat(input: ChatInput): Promise<ProviderChatOutput> {
    const started = Date.now();
    const modelName = input.modelName ?? this.defaultModel;
    const apiKey = this.decryptRequiredApiKey(input.encryptedApiKey);
    const messages = [
      ...(input.systemPrompt ? [{ role: "system", content: input.systemPrompt }] : []),
      { role: "user", content: input.prompt }
    ];
    const response = await fetch(joinUrl(input.baseUrl ?? this.defaultBaseUrl, "/chat/completions"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(withoutUndefined({
        model: modelName,
        messages,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        stream: false
      }))
    });
    const json = await readJson(response);
    assertProviderResponse(response, this.providerType);
    const content = json?.choices?.[0]?.message?.content ?? "";
    const usage = normalizeProviderUsage({
      reportedInputTokens: json?.usage?.prompt_tokens,
      reportedOutputTokens: json?.usage?.completion_tokens,
      cachedInputTokens: json?.usage?.prompt_tokens_details?.cached_tokens,
      reasoningTokens: json?.usage?.completion_tokens_details?.reasoning_tokens,
      estimatedInputText: `${input.systemPrompt ?? ""}\n${input.prompt}`,
      estimatedOutputText: content
    });
    return {
      content,
      providerType: this.providerType,
      modelName: json?.model ?? modelName,
      ...usage,
      latencyMs: Date.now() - started,
      raw: { id: json?.id, model: json?.model, usage: json?.usage }
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
    return { status: "healthy" as const, message: `${this.providerType} provider reachable`, checkedAt: new Date().toISOString() };
  }

  protected decryptRequiredApiKey(encryptedApiKey?: string) {
    if (!encryptedApiKey) throw new BadRequestException(`API key missing for ${this.providerType} provider`);
    try {
      return this.encryption.decrypt(encryptedApiKey);
    } catch {
      throw new BadRequestException(`API key missing or invalid for ${this.providerType} provider`);
    }
  }
}
