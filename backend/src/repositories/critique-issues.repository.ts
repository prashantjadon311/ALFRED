import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";
export interface CritiqueIssueDoc extends OwnedDoc { userId: ObjectId; workflowRunId: ObjectId; iteration: number; title: string; severity: "BLOCKER" | "HIGH" | "MEDIUM" | "LOW"; affectedArea: string; recommendation: string; status: "open" | "fixed" | "accepted_risk" | "false_positive"; sourceAgent: string; resolvedByExecutionId?: ObjectId; }
@Injectable()
export class CritiqueIssuesRepository extends BaseRepository<CritiqueIssueDoc> {
  constructor(db: DatabaseService) { super(db, "critique_issues"); }
  listOpen(workflowRunId: ObjectId) { return this.collection().find({ workflowRunId, status: "open" }).toArray(); }
  listByRun(workflowRunId: ObjectId, userId: ObjectId) { return this.collection().find({ workflowRunId, userId }).sort({ createdAt: 1 }).toArray(); }
  markFixed(workflowRunId: ObjectId, userId: ObjectId) { return this.collection().updateMany({ workflowRunId, userId, status: "open" }, { $set: { status: "fixed", updatedAt: new Date() } }); }
}
