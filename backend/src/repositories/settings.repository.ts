import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";
export interface SettingDoc extends OwnedDoc { userId: ObjectId; key: string; value: unknown; }
@Injectable()
export class SettingsRepository extends BaseRepository<SettingDoc> {
  constructor(db: DatabaseService) { super(db, "settings"); }
  findByKey(userId: ObjectId, key: string) { return this.collection().findOne({ userId, key }); }
  async upsert(userId: ObjectId, key: string, value: unknown) {
    await this.collection().updateOne({ userId, key }, { $set: { value, updatedAt: new Date() }, $setOnInsert: { userId, key, createdAt: new Date() } }, { upsert: true });
    return this.findByKey(userId, key);
  }
  /** @deprecated use upsert */
  upsertKey(userId: ObjectId, key: string, value: unknown) { return this.upsert(userId, key, value); }
}
