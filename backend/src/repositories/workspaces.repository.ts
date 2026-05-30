import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";

export interface WorkspaceDoc extends OwnedDoc {
  userId: ObjectId;
  name: string;
  description: string;
  plan: string;
  active: boolean;
  archived: boolean;
  defaultProvider?: string;
  defaultModel?: string;
  monthlyTokenLimit?: number;
  monthlyCostLimit?: number;
  themePreference?: "dark" | "light" | "system";
}

@Injectable()
export class WorkspacesRepository extends BaseRepository<WorkspaceDoc> {
  constructor(db: DatabaseService) {
    super(db, "workspaces");
  }

  async setActive(userId: ObjectId, workspaceId: ObjectId) {
    await this.collection().updateMany({ userId } as any, { $set: { active: false, updatedAt: new Date() } } as any);
    await this.collection().updateOne(
      { _id: workspaceId, userId, archived: { $ne: true } } as any,
      { $set: { active: true, updatedAt: new Date() } } as any
    );
    return this.findById(workspaceId, userId);
  }
}
