import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";

export interface ProjectDoc extends OwnedDoc {
  userId: ObjectId;
  workspaceId: ObjectId;
  name: string;
  description: string;
  type: "software" | "research" | "planning" | "mixed";
  status: string;
  progress: number;
  activeWorkflowId?: ObjectId;
  activeRequirementContractId?: ObjectId;
  tokenUsage: { inputTokens: number; outputTokens: number; totalTokens: number };
  cost: { totalUsd: number };
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ProjectsRepository extends BaseRepository<ProjectDoc> {
  constructor(db: DatabaseService) { super(db, "projects"); }
  async incrementUsage(projectId: ObjectId, userId: ObjectId, inputTokens: number, outputTokens: number, costUsd: number, workspaceId?: ObjectId) {
    const filter = workspaceId ? { _id: projectId, userId, workspaceId } : { _id: projectId, userId };
    await this.collection().updateOne(
      filter as any,
      { $inc: { "tokenUsage.inputTokens": inputTokens, "tokenUsage.outputTokens": outputTokens, "tokenUsage.totalTokens": inputTokens + outputTokens, "cost.totalUsd": costUsd } as any, $set: { updatedAt: new Date() } }
    );
  }
}
