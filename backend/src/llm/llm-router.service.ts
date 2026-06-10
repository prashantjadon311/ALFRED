import { BadRequestException, Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { AiModelsService } from "../modules/ai-models/ai-models.service";
import { ModelProvidersService } from "../modules/model-providers/model-providers.service";
import { LlmProvider } from "./interfaces/llm-provider.interface";
import { ChatInput } from "./interfaces/llm.types";
import { AnthropicProvider } from "./providers/anthropic.provider";
import { CustomOpenAiCompatibleProvider } from "./providers/custom-openai.provider";
import { GeminiProvider } from "./providers/gemini.provider";
import { MockLlmProvider } from "./providers/mock.provider";
import { OllamaProvider } from "./providers/ollama.provider";
import { OpenAiProvider } from "./providers/openai.provider";
import { PricingService } from "../modules/pricing/pricing.service";

@Injectable()
export class LlmRouterService {
  constructor(
    private readonly mock: MockLlmProvider,
    private readonly openai: OpenAiProvider,
    private readonly anthropic: AnthropicProvider,
    private readonly gemini: GeminiProvider,
    private readonly ollama: OllamaProvider,
    private readonly customOpenai: CustomOpenAiCompatibleProvider,
    private readonly modelProviders: ModelProvidersService,
    private readonly aiModels: AiModelsService,
    private readonly pricing: PricingService
  ) {}

  private get mockMode() {
    return (process.env.LLM_MOCK_MODE ?? "true") === "true";
  }

  selectProvider(providerType?: string): LlmProvider {
    if (this.mockMode || providerType === "mock") return this.mock;
    switch (providerType) {
      case "openai": return this.openai;
      case "anthropic": return this.anthropic;
      case "gemini": return this.gemini;
      case "ollama": return this.ollama;
      case "custom_openai_compatible": return this.customOpenai;
      default:
        throw new BadRequestException(`Unsupported LLM provider: ${providerType ?? "unspecified"}`);
    }
  }

  async chat(input: ChatInput) {
    const requestedAt = new Date();
    if (this.mockMode || input.providerType === "mock") {
      return this.withCost(await this.mock.chat({ ...input, providerType: "mock" }), requestedAt);
    }

    const resolved = await this.resolveProviderInput(input);
    return this.withCost(await this.selectProvider(resolved.providerType).chat(resolved), requestedAt);
  }

  estimateTokens(input: string) {
    return this.mock.estimateTokens(input);
  }

  private async withCost(output: Awaited<ReturnType<LlmProvider["chat"]>>, requestedAt: Date) {
    const cost = await this.pricing.calculateCost({
      providerType: output.providerType,
      modelName: output.modelName,
      usage: output,
      requestedAt
    });
    return { ...output, ...cost, calculatedAt: new Date() };
  }

  private async resolveProviderInput(input: ChatInput): Promise<ChatInput> {
    const userId = input.userId ? new ObjectId(input.userId) : undefined;
    let providerType = input.providerType;
    let modelName = input.modelName;

    if (!providerType && userId && modelName) {
      const model = await this.aiModels.findByName(userId, modelName);
      providerType = model?.providerType as string | undefined;
      modelName = (model?.name as string | undefined) ?? modelName;
    }

    if (!providerType) {
      throw new BadRequestException("LLM provider type is required when mock mode is disabled");
    }

    if (providerType === "mock") return { ...input, providerType: "mock", modelName };
    if (providerType === "ollama") {
      const provider = userId ? await this.modelProviders.resolveForLlm(userId, providerType) : null;
      return { ...input, providerType, modelName, baseUrl: input.baseUrl ?? provider?.baseUrl };
    }

    if (!userId) throw new BadRequestException(`API key missing for ${providerType} provider`);
    const provider = await this.modelProviders.resolveForLlm(userId, providerType);
    if (!provider?.encryptedApiKey) throw new BadRequestException(`API key missing for ${providerType} provider`);
    return {
      ...input,
      providerType,
      modelName,
      baseUrl: input.baseUrl ?? provider.baseUrl,
      encryptedApiKey: provider.encryptedApiKey
    };
  }
}
