import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { ModelProvidersRepository } from "../../repositories/model-providers.repository";
import { AuditLogsRepository } from "../../repositories/audit-logs.repository";
import { EncryptionService } from "../../security/encryption.service";
import { maskApiKey } from "../../security/api-key-masker";
import { LlmProvider } from "../../llm/interfaces/llm-provider.interface";
import { AnthropicProvider } from "../../llm/providers/anthropic.provider";
import { CustomOpenAiCompatibleProvider } from "../../llm/providers/custom-openai.provider";
import { GeminiProvider } from "../../llm/providers/gemini.provider";
import { MockLlmProvider } from "../../llm/providers/mock.provider";
import { OllamaProvider } from "../../llm/providers/ollama.provider";
import { OpenAiProvider } from "../../llm/providers/openai.provider";

@Injectable()
export class ModelProvidersService {
  constructor(
    private readonly repo: ModelProvidersRepository,
    private readonly audit: AuditLogsRepository,
    private readonly encryption: EncryptionService,
    private readonly mock: MockLlmProvider,
    private readonly openai: OpenAiProvider,
    private readonly anthropic: AnthropicProvider,
    private readonly gemini: GeminiProvider,
    private readonly ollama: OllamaProvider,
    private readonly customOpenai: CustomOpenAiCompatibleProvider
  ) {}

  async list(userId: ObjectId, page: number, limit: number) {
    const result = await this.repo.listByUser(userId, {}, { skip: (page - 1) * limit, limit, projection: { encryptedApiKey: 0 } });
    return { items: this.repo.serializeMany(result.items.map((doc) => this.redact(doc))), total: result.total };
  }

  async create(userId: ObjectId, body: { name: string; providerType: string; baseUrl?: string; apiKey?: string; config?: Record<string, unknown> }) {
    const encryptedApiKey = body.apiKey ? this.encryption.encrypt(body.apiKey) : undefined;
    const maskedApiKey = body.apiKey ? maskApiKey(body.apiKey) : undefined;
    const doc = await this.repo.create({ userId, name: body.name, providerType: body.providerType, baseUrl: body.baseUrl, encryptedApiKey, maskedApiKey, enabled: true, healthStatus: "unknown", config: body.config ?? {}, createdAt: new Date() } as any);
    await this.audit.audit({ userId, entityType: "model_provider", entityId: doc!._id!.toHexString(), action: "create" });
    return this.repo.serialize(this.redact(doc));
  }

  async get(userId: ObjectId, id: ObjectId) {
    const doc = await this.repo.findById(id, userId, { encryptedApiKey: 0 });
    if (!doc) throw new NotFoundException("Provider not found");
    return this.repo.serialize(doc);
  }

  async update(userId: ObjectId, id: ObjectId, body: { name?: string; baseUrl?: string; apiKey?: string; enabled?: boolean; config?: Record<string, unknown> }) {
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.baseUrl !== undefined) patch.baseUrl = body.baseUrl;
    if (body.enabled !== undefined) patch.enabled = body.enabled;
    if (body.config !== undefined) patch.config = body.config;
    if (body.apiKey) {
      patch.encryptedApiKey = this.encryption.encrypt(body.apiKey);
      patch.maskedApiKey = maskApiKey(body.apiKey);
    }
    const doc = await this.repo.updateById(id, userId, patch as any);
    if (!doc) throw new NotFoundException("Provider not found");
    await this.audit.audit({ userId, entityType: "model_provider", entityId: id.toHexString(), action: "update" });
    return this.repo.serialize(this.redact(doc));
  }

  async delete(userId: ObjectId, id: ObjectId) {
    const ok = await this.repo.deleteById(id, userId);
    if (!ok) throw new NotFoundException("Provider not found");
    await this.audit.audit({ userId, entityType: "model_provider", entityId: id.toHexString(), action: "delete" });
    return { deleted: true };
  }

  async test(userId: ObjectId, id: ObjectId) {
    const doc = await this.repo.findById(id, userId);
    if (!doc) throw new NotFoundException("Provider not found");
    const provider = this.mockMode ? this.mock : this.providerFor(doc.providerType);
    const modelName = typeof doc.config?.defaultModel === "string" ? doc.config.defaultModel : undefined;
    let health: { status: "healthy" | "degraded" | "offline"; message?: string; checkedAt?: string };
    try {
      health = this.mockMode
        ? { status: "healthy", message: `${doc.providerType} provider reachable (mock)`, checkedAt: new Date().toISOString() }
        : await provider.testConnection({ providerType: doc.providerType, modelName, baseUrl: doc.baseUrl, encryptedApiKey: doc.encryptedApiKey });
    } catch (error) {
      health = { status: "offline", message: this.cleanProviderError(error), checkedAt: new Date().toISOString() };
    }
    await this.repo.updateById(id, userId, { healthStatus: health.status } as any);
    return health;
  }

  async resolveForLlm(userId: ObjectId, providerType: string) {
    return this.repo.collection().find({ userId, providerType, enabled: { $ne: false } } as any).sort({ updatedAt: -1, createdAt: -1 }).limit(1).next();
  }

  private redact(doc: any) {
    if (!doc) return doc;
    const copy = { ...doc };
    delete copy.encryptedApiKey;
    return copy;
  }

  private get mockMode() {
    return (process.env.LLM_MOCK_MODE ?? "true") === "true";
  }

  private providerFor(providerType: string): LlmProvider {
    switch (providerType) {
      case "openai": return this.openai;
      case "anthropic": return this.anthropic;
      case "gemini": return this.gemini;
      case "ollama": return this.ollama;
      case "custom_openai_compatible": return this.customOpenai;
      case "mock": return this.mock;
      default:
        throw new BadRequestException(`Unsupported LLM provider: ${providerType}`);
    }
  }

  private cleanProviderError(error: unknown) {
    if (error instanceof BadRequestException) return error.message;
    if (error instanceof Error && /provider request failed with status \d+/.test(error.message)) return error.message;
    return "Provider test failed";
  }
}
