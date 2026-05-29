import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { WorkflowDsl } from "../contracts/workflow-dsl.types";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";
export interface WorkflowRunDoc extends OwnedDoc { userId: ObjectId; projectId: ObjectId; workflowId: ObjectId; status: string; currentNodeKey?: string; currentEdgeKey?: string; iteration: number; maxIterations: number; totalInputTokens: number; totalOutputTokens: number; totalCostUsd: number; budgetState: Record<string, unknown>; claudeVerdict?: string; requirementContractSnapshot: Record<string, unknown>; workflowDslSnapshot: WorkflowDsl; acceptedDecisions: unknown[]; rejectedIdeas: unknown[]; openIssues: unknown[]; stopReason?: string; errorMessage?: string; version: number; startedAt?: Date; completedAt?: Date; }
@Injectable()
export class WorkflowRunsRepository extends BaseRepository<WorkflowRunDoc> {
  constructor(db: DatabaseService) { super(db, "workflow_runs"); }
  updateStatus(id: ObjectId, userId: ObjectId, status: string, patch: Partial<WorkflowRunDoc> = {}) { return this.updateById(id, userId, { ...patch, status }); }
  async incrementUsage(id: ObjectId, userId: ObjectId, inputTokens: number, outputTokens: number, costUsd: number) {
    await this.collection().updateOne({ _id: id, userId } as any, { $inc: { totalInputTokens: inputTokens, totalOutputTokens: outputTokens, totalCostUsd: costUsd, version: 1 } as any, $set: { updatedAt: new Date() } });
  }
}
