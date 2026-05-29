import { Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { ModelProvidersRepository } from "../../repositories/model-providers.repository";
import { AuditLogsRepository } from "../../repositories/audit-logs.repository";
import { EncryptionService } from "../../security/encryption.service";
import { maskApiKey } from "../../security/api-key-masker";

@Injectable()
export class ModelProvidersService {
  constructor(
    private readonly repo: ModelProvidersRepository,
    private readonly audit: AuditLogsRepository,
    private readonly encryption: EncryptionService
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
    const health = { status: "healthy", message: `${doc.providerType} provider reachable (mock)`, checkedAt: new Date().toISOString() };
    await this.repo.updateById(id, userId, { healthStatus: "healthy" } as any);
    return health;
  }

  private redact(doc: any) {
    if (!doc) return doc;
    const copy = { ...doc };
    delete copy.encryptedApiKey;
    return copy;
  }
}
