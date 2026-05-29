import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";
export interface AgentNodeDoc extends OwnedDoc { userId: ObjectId; workflowId: ObjectId; nodeKey: string; nodeType: string; title: string; role?: string; providerType?: string; modelName?: string; systemPromptTemplateId?: ObjectId; inlineSystemPrompt?: string; temperature?: number; maxTokens?: number; budgetUsd?: number; retryPolicy?: Record<string, unknown>; inputMapping?: unknown; outputMapping?: unknown; config?: Record<string, unknown>; }
@Injectable()
export class AgentNodesRepository extends BaseRepository<AgentNodeDoc> { constructor(db: DatabaseService) { super(db, "agent_nodes"); } }
