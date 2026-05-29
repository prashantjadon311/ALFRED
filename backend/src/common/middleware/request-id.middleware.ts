import { Injectable, NestMiddleware } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "crypto";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: FastifyRequest & { requestId?: string }, res: FastifyReply["raw"], next: () => void) {
    const incoming = req.headers["x-request-id"];
    req.requestId = typeof incoming === "string" ? incoming : randomUUID();
    res.setHeader("x-request-id", req.requestId);
    next();
  }
}
