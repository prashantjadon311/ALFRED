import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";

export interface ChatDoc extends OwnedDoc {
  userId: ObjectId; projectId?: ObjectId; title: string; activeModelId?: ObjectId; parentChatId?: ObjectId; branchFromMessageId?: ObjectId; mode: "single" | "compare" | "agent_assisted"; systemPrompt?: string; settings: { temperature: number; topP: number; maxTokens: number }; tokenUsage: { inputTokens: number; outputTokens: number; totalTokens: number }; cost: { totalUsd: number };
}
@Injectable()
export class ChatsRepository extends BaseRepository<ChatDoc> {
  constructor(db: DatabaseService) { super(db, "chats"); }
  async incrementUsage(chatId: ObjectId, userId: ObjectId, inputTokens: number, outputTokens: number, costUsd: number) {
    await this.collection().updateOne({ _id: chatId, userId } as any, { $inc: { "tokenUsage.inputTokens": inputTokens, "tokenUsage.outputTokens": outputTokens, "tokenUsage.totalTokens": inputTokens + outputTokens, "cost.totalUsd": costUsd } as any, $set: { updatedAt: new Date() } });
  }
}
