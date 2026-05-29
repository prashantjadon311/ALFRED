import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";
export interface UsageEventDoc extends OwnedDoc { userId: ObjectId; projectId?: ObjectId; workflowRunId?: ObjectId; chatId?: ObjectId; providerType: string; modelName: string; inputTokens: number; outputTokens: number; totalTokens: number; costUsd: number; latencyMs: number; source: string; createdAt: Date; }
@Injectable()
export class UsageEventsRepository extends BaseRepository<UsageEventDoc> { constructor(db: DatabaseService) { super(db, "usage_events"); } }
