import { Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { AiModelsRepository } from "../../repositories/ai-models.repository";

@Injectable()
export class AiModelsService {
  constructor(private readonly repo: AiModelsRepository) {}

  async list(userId: ObjectId, page: number, limit: number, providerId?: string) {
    const filter: Record<string, unknown> = {};
    if (providerId) filter.providerId = new ObjectId(providerId);
    const result = await this.repo.listByUser(userId, filter as any, { skip: (page - 1) * limit, limit });
    return { items: this.repo.serializeMany(result.items), total: result.total };
  }

  async update(userId: ObjectId, id: ObjectId, body: { enabled?: boolean; defaultRole?: string; displayName?: string; inputCostPer1k?: number; outputCostPer1k?: number }) {
    const doc = await this.repo.updateById(id, userId, body as any);
    if (!doc) throw new NotFoundException("Model not found");
    return this.repo.serialize(doc);
  }

  async findByName(userId: ObjectId, modelName: string) {
    return this.repo.collection().findOne({
      userId,
      enabled: { $ne: false },
      $or: [{ name: modelName }, { displayName: modelName }]
    } as any);
  }
}
