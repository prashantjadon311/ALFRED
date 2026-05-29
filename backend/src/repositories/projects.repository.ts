import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";

export interface ProjectDoc extends OwnedDoc {
  userId: ObjectId;
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
  async incrementUsage(projectId: ObjectId, userId: ObjectId, inputTokens: number, outputTokens: number, costUsd: number) {
    await this.collection().updateOne(
      { _id: projectId, userId } as any,
      { $inc: { "tokenUsage.inputTokens": inputTokens, "tokenUsage.outputTokens": outputTokens, "tokenUsage.totalTokens": inputTokens + outputTokens, "cost.totalUsd": costUsd } as any, $set: { updatedAt: new Date() } }
    );
  }
}
