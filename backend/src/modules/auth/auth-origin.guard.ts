import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { FastifyRequest } from "fastify";

@Injectable()
export class AuthOriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const origin = request.headers.origin;
    const nodeEnv = this.config.get<string>("nodeEnv") ?? "development";
    const frontendOrigins = this.config.get<string[]>("frontendOrigins") ?? [];

    if (nodeEnv === "test" && !origin) return true;
    if (nodeEnv !== "production") {
      return !origin || frontendOrigins.includes(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin);
    }
    if (origin && frontendOrigins.includes(origin)) return true;
    throw new ForbiddenException("Untrusted request origin");
  }
}
