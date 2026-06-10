import { ObjectId } from "mongodb";
import * as bcrypt from "bcryptjs";
import { AuthService } from "../src/modules/auth/auth.service";

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));

const userId = new ObjectId();
const activeUser = {
  _id: userId,
  name: "Test User",
  email: "test@example.com",
  passwordHash: "stored-password",
  refreshTokenHash: "stored-refresh",
  role: "user",
  status: "active"
};

function makeService(user = activeUser) {
  const users = {
    findByEmail: jest.fn(async () => user),
    findById: jest.fn(async () => user),
    create: jest.fn(),
    updateRefreshToken: jest.fn(async () => ({ acknowledged: true })),
    rotateRefreshToken: jest.fn(async () => ({ acknowledged: true, matchedCount: 1 })),
    serialize: jest.fn((value) => value)
  };
  const jwt = {
    signAsync: jest.fn()
      .mockResolvedValueOnce("access-token")
      .mockResolvedValueOnce("refresh-token"),
    verifyAsync: jest.fn(async () => ({ sub: userId.toHexString(), email: activeUser.email, role: "user", tokenType: "refresh", jti: "jti" }))
  };
  const config = {
    get: jest.fn((key: string) => ({
      accessSecret: "access-secret",
      refreshSecret: "refresh-secret",
      accessTtl: "15m",
      refreshTtl: "7d"
    }[key]))
  };
  const audit = { audit: jest.fn(async () => undefined) };
  const provisioning = { provision: jest.fn() };
  return {
    service: new AuthService(users as any, jwt as any, config as any, audit as any, provisioning as any),
    users,
    jwt,
    audit
  };
}

describe("AuthService secure sessions", () => {
  const compareMock = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
  const hashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

  beforeEach(() => {
    jest.clearAllMocks();
    compareMock.mockResolvedValue(true as never);
    hashMock.mockResolvedValue("new-hash" as never);
  });

  it("rejects login for a disabled user", async () => {
    const { service } = makeService({ ...activeUser, status: "disabled" });
    await expect(service.login({ email: activeUser.email, password: "password" })).rejects.toThrow("Invalid credentials");
  });

  it("issues typed access and refresh payloads with a refresh jti", async () => {
    const { service, jwt } = makeService();

    await service.login({ email: activeUser.email, password: "password" });

    expect(jwt.signAsync.mock.calls[0][0]).toEqual(expect.objectContaining({ tokenType: "access" }));
    expect(jwt.signAsync.mock.calls[1][0]).toEqual(expect.objectContaining({ tokenType: "refresh", jti: expect.any(String) }));
  });

  it("rotates the stored refresh hash", async () => {
    hashMock.mockResolvedValue("rotated-hash" as never);
    const { service, users, audit } = makeService();

    const result = await service.refresh("current-refresh");

    expect(result.refreshToken).toBe("refresh-token");
    expect(users.rotateRefreshToken).toHaveBeenCalledWith(userId, activeUser.refreshTokenHash, "rotated-hash");
    expect(audit.audit).toHaveBeenCalledWith(expect.objectContaining({ action: "refresh" }));
  });

  it("rejects refresh when the stored token is revoked during rotation", async () => {
    const { service, users } = makeService();
    users.rotateRefreshToken.mockResolvedValueOnce({ acknowledged: true, matchedCount: 0 });

    await expect(service.refresh("current-refresh")).rejects.toThrow("Refresh token revoked");
  });

  it("revokes the session and audits valid-token reuse", async () => {
    compareMock.mockResolvedValue(false as never);
    const { service, users, audit } = makeService();

    await expect(service.refresh("reused-refresh")).rejects.toThrow("Refresh token revoked");

    expect(users.updateRefreshToken).toHaveBeenCalledWith(userId);
    expect(audit.audit).toHaveBeenCalledWith(expect.objectContaining({ action: "refresh_token_reuse_detected" }));
  });

  it("logout clears only a matching current refresh token", async () => {
    const { service, users, audit } = makeService();

    await service.logoutByRefreshToken("current-refresh");

    expect(users.updateRefreshToken).toHaveBeenCalledWith(userId);
    expect(audit.audit).toHaveBeenCalledWith(expect.objectContaining({ action: "logout" }));
  });

  it("logout leaves the current session intact for a mismatched refresh token", async () => {
    compareMock.mockResolvedValue(false as never);
    const { service, users, audit } = makeService();

    await service.logoutByRefreshToken("older-refresh");

    expect(users.updateRefreshToken).not.toHaveBeenCalled();
    expect(audit.audit).not.toHaveBeenCalled();
  });

  it("invalid logout tokens do not throw or revoke", async () => {
    const { service, users } = makeService();
    (service as any).jwt.verifyAsync.mockRejectedValue(new Error("expired"));

    await expect(service.logoutByRefreshToken("expired")).resolves.toBeUndefined();
    expect(users.updateRefreshToken).not.toHaveBeenCalled();
  });
});
