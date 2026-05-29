import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";

export interface ProjectMemoryDoc extends OwnedDoc {
  userId: ObjectId; projectId: ObjectId; bullets: string[]; files: unknown[];
  contextPolicy: { injectMemory: boolean; maxMemoryTokens: number; includeRecentChats: boolean; includeArtifacts: boolean };
}
@Injectable()
export class ProjectMemoryRepository extends BaseRepository<ProjectMemoryDoc> {
  constructor(db: DatabaseService) { super(db, "project_memory"); }
  findByProject(userId: ObjectId, projectId: ObjectId) { return this.collection().findOne({ userId, projectId }); }
  async upsert(userId: ObjectId, projectId: ObjectId, patch: Partial<ProjectMemoryDoc>) {
    await this.collection().updateOne({ userId, projectId }, { $set: { ...patch, userId, projectId, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
    return this.findByProject(userId, projectId);
  }
}
