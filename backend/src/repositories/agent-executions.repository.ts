import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";
export interface AgentExecutionDoc extends OwnedDoc { userId: ObjectId; workflowRunId: ObjectId; agentNodeId?: ObjectId; nodeKey: string; nodeType: string; status: string; input?: unknown; output?: string; structuredOutput?: unknown; inputTokens: number; outputTokens: number; cachedInputTokens?: number; reasoningTokens?: number; costUsd: number; pricingSnapshotId?: string; usageSource?: "exact" | "estimated"; costSource?: "exact" | "estimated" | "unavailable"; calculatedAt?: Date; latencyMs: number; errorMessage?: string; attempt: number; idempotencyKey?: string; startedAt?: Date; completedAt?: Date; }
@Injectable()
export class AgentExecutionsRepository extends BaseRepository<AgentExecutionDoc> { constructor(db: DatabaseService) { super(db, "agent_executions"); } }
