import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";
export interface AgentDecisionDoc extends OwnedDoc { userId: ObjectId; workflowRunId: ObjectId; decision: string; reason: string; proposedBy: string; status: "proposed" | "accepted" | "rejected" | "superseded"; relatedIssueIds?: ObjectId[]; createdAt: Date; }
@Injectable()
export class AgentDecisionsRepository extends BaseRepository<AgentDecisionDoc> { constructor(db: DatabaseService) { super(db, "agent_decisions"); } }
