import { BadRequestException, Injectable } from "@nestjs/common";
import { EncryptionService } from "../../security/encryption.service";
import { LlmProvider } from "../interfaces/llm-provider.interface";
import { ChatInput, ChatOutput } from "../interfaces/llm.types";
import { assertProviderResponse, estimateTokens, joinUrl, readJson } from "./http-provider.utils";

@Injectable()
export class GeminiProvider implements LlmProvider {
  providerType: LlmProvider["providerType"] = "gemini";
  private readonly defaultBaseUrl = "https://generativelanguage.googleapis.com/v1beta";
  private readonly defaultModel = "gemini-1.5-flash";

  constructor(private readonly encryption: EncryptionService) {}

  async chat(input: ChatInput): Promise<ChatOutput> {
    const started = Date.now();
    const modelName = input.modelName ?? this.defaultModel;
    const apiKey = this.decryptRequiredApiKey(input.encryptedApiKey);
    const response = await fetch(`${joinUrl(input.baseUrl ?? this.defaultBaseUrl, `/models/${modelName}:generateContent`)}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(input.systemPrompt ? { systemInstruction: { parts: [{ text: input.systemPrompt }] } } : {}),
        contents: [{ role: "user", parts: [{ text: input.prompt }] }],
        generationConfig: {
          ...(input.temperature !== undefined ? { temperature: input.temperature } : {}),
          ...(input.maxTokens !== undefined ? { maxOutputTokens: input.maxTokens } : {})
        }
      })
    });
    const json = await readJson(response);
    assertProviderResponse(response, this.providerType);
    const parts = json?.candidates?.[0]?.content?.parts;
    const content = Array.isArray(parts) ? parts.map((part: any) => part?.text ?? "").join("") : "";
    return {
      content,
      providerType: this.providerType,
      modelName,
      inputTokens: json?.usageMetadata?.promptTokenCount ?? estimateTokens(`${input.systemPrompt ?? ""}\n${input.prompt}`),
      outputTokens: json?.usageMetadata?.candidatesTokenCount ?? estimateTokens(content),
      costUsd: 0,
      latencyMs: Date.now() - started,
      raw: { usageMetadata: json?.usageMetadata }
    };
  }

  async estimateTokens(input: string) {
    return estimateTokens(input);
  }

  async getModels() {
    return [{ name: this.defaultModel, contextWindow: 1000000 }];
  }

  async testConnection(input: Partial<ChatInput> = {}) {
    await this.chat({ prompt: "Return only ok.", maxTokens: 8, ...input });
    return { status: "healthy" as const, message: "gemini provider reachable", checkedAt: new Date().toISOString() };
  }

  private decryptRequiredApiKey(encryptedApiKey?: string) {
    if (!encryptedApiKey) throw new BadRequestException("API key missing for gemini provider");
    try {
      return this.encryption.decrypt(encryptedApiKey);
    } catch {
      throw new BadRequestException("API key missing or invalid for gemini provider");
    }
  }
}
