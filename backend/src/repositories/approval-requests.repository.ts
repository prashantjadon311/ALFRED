import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";
export interface ApprovalRequestDoc extends OwnedDoc { userId: ObjectId; projectId?: ObjectId; workflowRunId?: ObjectId; type: string; status: "pending" | "approved" | "rejected" | "expired"; title: string; description: string; payload?: unknown; requestedBy: string; approvedBy?: ObjectId; decisionReason?: string; decidedAt?: Date; }
@Injectable()
export class ApprovalRequestsRepository extends BaseRepository<ApprovalRequestDoc> { constructor(db: DatabaseService) { super(db, "approval_requests"); } }
