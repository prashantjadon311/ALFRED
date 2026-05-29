import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";
export interface AgentMessageDoc extends OwnedDoc { userId: ObjectId; workflowRunId: ObjectId; iteration: number; fromAgent: string; toAgent?: string; nodeKey: string; messageType: string; content: string; structuredContent?: unknown; createdAt: Date; }
@Injectable()
export class AgentMessagesRepository extends BaseRepository<AgentMessageDoc> { constructor(db: DatabaseService) { super(db, "agent_messages"); } }
