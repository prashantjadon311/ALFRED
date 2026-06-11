import { ObjectId } from "mongodb";
import { AuditLogsController } from "../src/modules/audit-logs/audit-logs.controller";

describe("AuditLogsController scope selection", () => {
  const userId = new ObjectId();
  const workspaceId = new ObjectId();

  function makeController() {
    const repo = {
      listWorkspace: jest.fn(async () => ({ items: [], total: 0 })),
      listUserScope: jest.fn(async () => ({ items: [], total: 0 })),
      listAllForUser: jest.fn(async () => ({ items: [], total: 0 })),
      serializeMany: jest.fn((items) => items)
    };
    const scope = {
      resolve: jest.fn(async () => workspaceId)
    };
    return {
      controller: new AuditLogsController(repo as any, scope as any),
      repo,
      scope
    };
  }

  it("uses workspace scope by default", async () => {
    const { controller, repo } = makeController();
    await controller.list({ userId: userId.toHexString() } as any, workspaceId.toHexString());
    expect(repo.listWorkspace).toHaveBeenCalledWith(userId, workspaceId, 0, 50);
  });

  it("uses listUserScope for scope=user", async () => {
    const { controller, repo } = makeController();
    await controller.list({ userId: userId.toHexString() } as any, undefined, "1", "50", "user");
    expect(repo.listUserScope).toHaveBeenCalledWith(userId, 0, 50);
  });

  it("uses listAllForUser for scope=all", async () => {
    const { controller, repo } = makeController();
    await controller.list({ userId: userId.toHexString() } as any, undefined, "2", "10", "all");
    expect(repo.listAllForUser).toHaveBeenCalledWith(userId, 10, 10);
  });

  it("resolves workspace id from the header", async () => {
    const { controller, scope } = makeController();
    const header = workspaceId.toHexString();
    await controller.list({ userId: userId.toHexString() } as any, header);
    expect(scope.resolve).toHaveBeenCalledWith(userId, header);
  });
});
