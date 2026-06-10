import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";

export interface MessageDoc extends OwnedDoc {
  userId: ObjectId; workspaceId: ObjectId; chatId: ObjectId; projectId?: ObjectId; role: "user" | "assistant" | "system" | "tool"; content: string; modelId?: ObjectId; providerType?: string; modelName?: string; inputTokens?: number; outputTokens?: number; cachedInputTokens?: number; reasoningTokens?: number; costUsd?: number; pricingSnapshotId?: string; usageSource?: "exact" | "estimated"; costSource?: "exact" | "estimated" | "unavailable"; calculatedAt?: Date; latencyMs?: number; parentMessageId?: ObjectId; metadata?: Record<string, unknown>; createdAt: Date;
}
@Injectable()
export class MessagesRepository extends BaseRepository<MessageDoc> {
  constructor(db: DatabaseService) { super(db, "messages"); }

  async listByChat(chatId: ObjectId, skip = 0, limit = 50, userId?: ObjectId, workspaceId?: ObjectId) {
    const filter = { chatId, ...(userId ? { userId } : {}), ...(workspaceId ? { workspaceId } : {}) } as any;
    const cursor = this.collection().find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit);
    const [items, total] = await Promise.all([cursor.toArray(), this.collection().countDocuments(filter)]);
    return { items, total };
  }

  findById(id: ObjectId) {
    return this.collection().findOne({ _id: id });
  }
}
