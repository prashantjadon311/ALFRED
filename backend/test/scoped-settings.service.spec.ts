import { BadRequestException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { SettingsService } from "../src/modules/settings/settings.service";

describe("SettingsService scoped settings", () => {
  const userId = new ObjectId();
  const workspaceId = new ObjectId();

  function makeService() {
    const repo = {
      listUserSettings: jest.fn(async () => [
        { key: "theme", value: "dark" },
        { key: "defaultModel", value: "user-model" }
      ]),
      listWorkspaceSettings: jest.fn(async () => [
        { key: "defaultModel", value: "workspace-model" },
        { key: "temperature", value: 0.2 }
      ]),
      findScoped: jest.fn(),
      upsertScoped: jest.fn(async () => ({}))
    };
    return {
      service: new SettingsService(repo as any),
      repo
    };
  }

  it("returns only user settings for scope=user", async () => {
    const { service } = makeService();
    await expect(service.getAll(userId, workspaceId, "user")).resolves.toEqual({
      theme: "dark",
      defaultModel: "user-model"
    });
  });

  it("returns only workspace settings for scope=workspace", async () => {
    const { service } = makeService();
    await expect(service.getAll(userId, workspaceId, "workspace")).resolves.toEqual({
      defaultModel: "workspace-model",
      temperature: 0.2
    });
  });

  it("merges user and workspace settings for effective scope", async () => {
    const { service } = makeService();
    await expect(service.getAll(userId, workspaceId)).resolves.toEqual({
      theme: "dark",
      defaultModel: "workspace-model",
      temperature: 0.2
    });
  });

  it("lets workspace settings override user values", async () => {
    const { service } = makeService();
    const result = await service.getAll(userId, workspaceId, "effective");
    expect(result.defaultModel).toBe("workspace-model");
  });

  it("rejects an invalid scope", async () => {
    const { service } = makeService();
    await expect(service.getAll(userId, workspaceId, "organization"))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it("writes setAll to workspace scope by default", async () => {
    const { service, repo } = makeService();

    await service.setAll(userId, workspaceId, {
      theme: "light",
      defaultModel: "workspace-model"
    });

    expect(repo.upsertScoped).toHaveBeenCalledWith(
      userId,
      "theme",
      "light",
      "workspace",
      workspaceId
    );
    expect(repo.upsertScoped).toHaveBeenCalledWith(
      userId,
      "defaultModel",
      "workspace-model",
      "workspace",
      workspaceId
    );
  });
});
