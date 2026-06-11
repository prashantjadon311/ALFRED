import { BadRequestException, Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { SettingsRepository, SettingScopeType } from "../../repositories/settings.repository";

@Injectable()
export class SettingsService {
  constructor(private readonly repo: SettingsRepository) {}

  private docsToObject(items: Array<{ key: string; value: unknown }>) {
    return items.reduce((acc: Record<string, unknown>, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
  }

  private parseScope(scope?: string): SettingScopeType | "effective" {
    if (!scope || scope === "effective") return "effective";
    if (scope === "user" || scope === "workspace") return scope;
    throw new BadRequestException("Invalid settings scope");
  }

  async getAll(userId: ObjectId, workspaceId: ObjectId, scope?: string) {
    const parsedScope = this.parseScope(scope);

    if (parsedScope === "user") {
      return this.docsToObject(await this.repo.listUserSettings(userId));
    }

    if (parsedScope === "workspace") {
      return this.docsToObject(await this.repo.listWorkspaceSettings(userId, workspaceId));
    }

    const [userSettings, workspaceSettings] = await Promise.all([
      this.repo.listUserSettings(userId),
      this.repo.listWorkspaceSettings(userId, workspaceId)
    ]);

    return {
      ...this.docsToObject(userSettings),
      ...this.docsToObject(workspaceSettings)
    };
  }

  async getKey(userId: ObjectId, workspaceId: ObjectId, key: string, scope?: string) {
    const parsedScope = this.parseScope(scope);

    if (parsedScope === "user") {
      return this.repo.findScoped(userId, key, "user");
    }

    if (parsedScope === "workspace") {
      return this.repo.findScoped(userId, key, "workspace", workspaceId);
    }

    return (
      await this.repo.findScoped(userId, key, "workspace", workspaceId)
    ) ?? await this.repo.findScoped(userId, key, "user");
  }

  async setAll(
    userId: ObjectId,
    workspaceId: ObjectId,
    settings: Record<string, unknown>,
    scope = "workspace"
  ) {
    const parsedScope = this.parseScope(scope);
    const writeScope = parsedScope === "effective" ? "workspace" : parsedScope;

    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        this.repo.upsertScoped(
          userId,
          key,
          value,
          writeScope,
          writeScope === "workspace" ? workspaceId : undefined
        )
      )
    );

    return this.getAll(userId, workspaceId);
  }

  async setKey(
    userId: ObjectId,
    workspaceId: ObjectId,
    key: string,
    value: unknown,
    scope = "workspace"
  ) {
    const parsedScope = this.parseScope(scope);
    const writeScope = parsedScope === "effective" ? "workspace" : parsedScope;

    return this.repo.upsertScoped(
      userId,
      key,
      value,
      writeScope,
      writeScope === "workspace" ? workspaceId : undefined
    );
  }
}
