import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { FastifyReply, FastifyRequest } from "fastify";

@Injectable()
export class AuthCookieService {
  constructor(private readonly config: ConfigService) {}

  getRefreshToken(request: FastifyRequest) {
    return request.cookies?.[this.name()];
  }

  requireRefreshToken(request: FastifyRequest) {
    const token = this.getRefreshToken(request);
    if (!token) throw new UnauthorizedException("Refresh token missing");
    return token;
  }

  setRefreshCookie(reply: FastifyReply, token: string) {
    reply.setCookie(this.name(), token, { ...this.options(), maxAge: this.parseTtlSeconds(this.config.get<string>("refreshTtl") ?? "7d") });
  }

  clearRefreshCookie(reply: FastifyReply) {
    reply.clearCookie(this.name(), this.options());
  }

  applyNoStore(reply: FastifyReply) {
    reply.header("Cache-Control", "no-store");
    reply.header("Pragma", "no-cache");
  }

  private name() {
    return this.config.get<string>("refreshCookieName") ?? "alfred_refresh_token";
  }

  private options() {
    const domain = this.config.get<string>("refreshCookieDomain");
    return {
      httpOnly: true,
      secure: this.config.get<boolean>("refreshCookieSecure") ?? false,
      sameSite: this.config.get<"strict" | "lax" | "none">("refreshCookieSameSite") ?? "lax",
      path: this.config.get<string>("refreshCookiePath") ?? "/auth",
      ...(domain ? { domain } : {})
    } as const;
  }

  private parseTtlSeconds(value: string) {
    const normalized = value.trim().toLowerCase();
    if (/^\d+$/.test(normalized)) return Number(normalized);
    const match = normalized.match(/^(\d+)([mhd])$/);
    if (!match) throw new Error("Unsupported refresh token TTL");
    const amount = Number(match[1]);
    const multiplier = match[2] === "m" ? 60 : match[2] === "h" ? 3600 : 86400;
    return amount * multiplier;
  }
}
