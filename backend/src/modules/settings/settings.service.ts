import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { SettingsRepository } from "../../repositories/settings.repository";

@Injectable()
export class SettingsService {
  constructor(private readonly repo: SettingsRepository) {}

  async getAll(userId: ObjectId) {
    const { items } = await this.repo.listByUser(userId, {} as any, {});
    return items.reduce((acc: Record<string, unknown>, s: any) => { acc[s.key] = s.value; return acc; }, {});
  }

  async getKey(userId: ObjectId, key: string) {
    return this.repo.findByKey(userId, key);
  }

  async setAll(userId: ObjectId, settings: Record<string, unknown>) {
    await Promise.all(Object.entries(settings).map(([key, value]) => this.repo.upsert(userId, key, value)));
    return this.getAll(userId);
  }

  async setKey(userId: ObjectId, key: string, value: unknown) {
    return this.repo.upsert(userId, key, value);
  }
}
