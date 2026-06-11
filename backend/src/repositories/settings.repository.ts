import { Injectable } from "@nestjs/common";
import { Filter, ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";

export type SettingScopeType = "user" | "workspace";

export interface SettingDoc extends OwnedDoc {
  userId: ObjectId;
  workspaceId?: ObjectId;
  scopeType: SettingScopeType;
  key: string;
  value: unknown;
}

@Injectable()
export class SettingsRepository extends BaseRepository<SettingDoc> {
  constructor(db: DatabaseService) {
    super(db, "settings");
  }

  listUserSettings(userId: ObjectId) {
    return this.collection()
      .find({ userId, scopeType: "user" } as Filter<SettingDoc>)
      .sort({ key: 1 })
      .toArray();
  }

  listWorkspaceSettings(userId: ObjectId, workspaceId: ObjectId) {
    return this.collection()
      .find({ userId, workspaceId, scopeType: "workspace" } as Filter<SettingDoc>)
      .sort({ key: 1 })
      .toArray();
  }

  findScoped(userId: ObjectId, key: string, scopeType: SettingScopeType, workspaceId?: ObjectId) {
    const filter: Filter<SettingDoc> = { userId, key, scopeType } as Filter<SettingDoc>;
    if (scopeType === "workspace") {
      (filter as Record<string, unknown>).workspaceId = workspaceId;
    }
    return this.collection().findOne(filter);
  }

  async upsertScoped(
    userId: ObjectId,
    key: string,
    value: unknown,
    scopeType: SettingScopeType,
    workspaceId?: ObjectId
  ) {
    const filter: Filter<SettingDoc> = { userId, key, scopeType } as Filter<SettingDoc>;
    if (scopeType === "workspace") {
      (filter as Record<string, unknown>).workspaceId = workspaceId;
    }

    const insert: Partial<SettingDoc> = {
      userId,
      key,
      scopeType,
      createdAt: new Date()
    };

    if (scopeType === "workspace") {
      insert.workspaceId = workspaceId;
    }

    await this.collection().updateOne(
      filter,
      {
        $set: { value, updatedAt: new Date() },
        $setOnInsert: insert
      },
      { upsert: true }
    );

    return this.findScoped(userId, key, scopeType, workspaceId);
  }

  /** @deprecated use upsertScoped */
  upsert(userId: ObjectId, key: string, value: unknown) {
    return this.upsertScoped(userId, key, value, "user");
  }

  /** @deprecated use upsertScoped */
  upsertKey(userId: ObjectId, key: string, value: unknown) {
    return this.upsert(userId, key, value);
  }
}
