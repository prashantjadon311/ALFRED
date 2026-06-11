import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { UsersRepository } from "../../repositories/users.repository";
import { AuditLogsRepository } from "../../repositories/audit-logs.repository";
import { UserProvisioningService } from "./user-provisioning.service";
import { createHash, randomUUID } from "node:crypto";

type TokenType = "access" | "refresh";

type IssuedSession = {
  user: ReturnType<UsersRepository["serialize"]>;
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditLogsRepository,
    private readonly provisioning: UserProvisioningService
  ) {}

  async register(input: { name: string; email: string; password: string }) {
    const email = input.email.toLowerCase();
    if (await this.users.findByEmail(email)) throw new ConflictException("Email already registered");
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.users.create({ name: input.name, email, passwordHash, role: "user", status: "active", createdAt: new Date() } as any);
    await this.provisioning.provision(user!._id!);
    await this.auditSafely({ userId: user!._id, entityType: "user", entityId: user!._id!.toHexString(), action: "register" });
    return this.issueTokens(user!);
  }

  async login(input: { email: string; password: string }) {
    const user = await this.users.findByEmail(input.email.toLowerCase());
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new UnauthorizedException("Invalid credentials");
    if (user.status !== "active") throw new UnauthorizedException("Invalid credentials");
    await this.auditSafely({ userId: user._id, entityType: "user", entityId: user._id!.toHexString(), action: "login" });
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; role: string; tokenType?: TokenType };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: this.config.get<string>("refreshSecret") });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (payload.tokenType !== "refresh") throw new UnauthorizedException("Invalid refresh token");
    let userId: ObjectId;
    try {
      userId = new ObjectId(payload.sub);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const user = await this.users.findById(userId);
    if (!user || user.status !== "active") throw new UnauthorizedException("Refresh token revoked");
    if (!user.refreshTokenHash) throw new UnauthorizedException("Refresh token revoked");
    if (!(await bcrypt.compare(this.refreshTokenMaterial(refreshToken), user.refreshTokenHash))) {
      await this.auditSafely({
        userId: user._id,
        entityType: "user",
        entityId: user._id!.toHexString(),
        action: "refresh_token_stale"
      });

      throw this.staleRefreshToken();
    }
    const session = await this.issueTokens(user, user.refreshTokenHash);
    await this.auditSafely({ userId: user._id, entityType: "user", entityId: user._id!.toHexString(), action: "refresh" });
    return session;
  }

  async logoutByRefreshToken(refreshToken?: string) {
    if (!refreshToken) return;
    let payload: { sub: string; tokenType?: TokenType };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: this.config.get<string>("refreshSecret") });
    } catch {
      return;
    }
    if (payload.tokenType !== "refresh") return;
    let userId: ObjectId;
    try {
      userId = new ObjectId(payload.sub);
    } catch {
      return;
    }
    const user = await this.users.findById(userId);
    if (!user?.refreshTokenHash || !(await bcrypt.compare(this.refreshTokenMaterial(refreshToken), user.refreshTokenHash))) return;
    await this.users.updateRefreshToken(user._id!);
    await this.auditSafely({ userId: user._id, entityType: "user", entityId: user._id!.toHexString(), action: "logout" });
  }

  async me(userId: string) {
    const user = await this.users.findById(new ObjectId(userId), undefined, { passwordHash: 0, refreshTokenHash: 0 });
    if (!user || user.status !== "active") throw new UnauthorizedException("Invalid or disabled user");
    return this.users.serialize(user);
  }

  private staleRefreshToken() {
    return new UnauthorizedException({
      code: "REFRESH_TOKEN_STALE",
      message: "Refresh token was rotated or revoked"
    });
  }

  private async auditSafely(input: Parameters<AuditLogsRepository["audit"]>[0]) {
    try {
      await this.audit.audit(input);
    } catch (error) {
      this.logger.warn(
        `Auth audit failed for ${input.action}: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      );
    }
  }

  private refreshTokenMaterial(refreshToken: string) {
    return createHash("sha256").update(refreshToken).digest("hex");
  }

  private async issueTokens(user: any, currentRefreshTokenHash?: string): Promise<IssuedSession> {
    const identity = { sub: user._id.toHexString(), email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync({ ...identity, tokenType: "access" satisfies TokenType }, { secret: this.config.get<string>("accessSecret"), expiresIn: this.config.get<string>("accessTtl") });
    const refreshToken = await this.jwt.signAsync({ ...identity, tokenType: "refresh" satisfies TokenType, jti: randomUUID() }, { secret: this.config.get<string>("refreshSecret"), expiresIn: this.config.get<string>("refreshTtl") });
    const refreshTokenHash = await bcrypt.hash(this.refreshTokenMaterial(refreshToken), 12);
    if (currentRefreshTokenHash) {
      const rotated = await this.users.rotateRefreshToken(user._id, currentRefreshTokenHash, refreshTokenHash);
      if (rotated.matchedCount !== 1) throw this.staleRefreshToken();
    } else {
      await this.users.updateRefreshToken(user._id, refreshTokenHash);
    }
    const safeUser = { ...user };
    delete safeUser.passwordHash;
    delete safeUser.refreshTokenHash;
    return { user: this.users.serialize(safeUser), accessToken, refreshToken };
  }
}
