import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { UsersRepository } from "../../repositories/users.repository";
import { AuditLogsRepository } from "../../repositories/audit-logs.repository";
import { UserProvisioningService } from "./user-provisioning.service";

@Injectable()
export class AuthService {
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
    await this.audit.audit({ userId: user!._id, entityType: "user", entityId: user!._id!.toHexString(), action: "register" });
    return this.issueTokens(user!);
  }

  async login(input: { email: string; password: string }) {
    const user = await this.users.findByEmail(input.email.toLowerCase());
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new UnauthorizedException("Invalid credentials");
    await this.audit.audit({ userId: user._id, entityType: "user", entityId: user._id!.toHexString(), action: "login" });
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; role: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: this.config.get<string>("refreshSecret") });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const user = await this.users.findById(new ObjectId(payload.sub));
    if (!user?.refreshTokenHash || !(await bcrypt.compare(refreshToken, user.refreshTokenHash))) throw new UnauthorizedException("Refresh token revoked");
    return this.issueTokens(user);
  }

  async logout(userId: string) {
    await this.users.updateRefreshToken(new ObjectId(userId));
  }

  async me(userId: string) {
    const user = await this.users.findById(new ObjectId(userId), undefined, { passwordHash: 0, refreshTokenHash: 0 });
    return this.users.serialize(user);
  }

  private async issueTokens(user: any) {
    const payload = { sub: user._id.toHexString(), email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload, { secret: this.config.get<string>("accessSecret"), expiresIn: this.config.get<string>("accessTtl") });
    const refreshToken = await this.jwt.signAsync(payload, { secret: this.config.get<string>("refreshSecret"), expiresIn: this.config.get<string>("refreshTtl") });
    await this.users.updateRefreshToken(user._id, await bcrypt.hash(refreshToken, 12));
    return { user: this.users.serialize({ ...user, passwordHash: undefined, refreshTokenHash: undefined }), accessToken, refreshToken };
  }
}
