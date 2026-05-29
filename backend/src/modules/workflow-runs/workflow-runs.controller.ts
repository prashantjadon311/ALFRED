import { Controller, Get, Param, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok, list } from "../../contracts/api-response.types";
import { WorkflowRunsService } from "./workflow-runs.service";

@UseGuards(JwtAuthGuard)
@Controller("workflow-runs")
export class WorkflowRunsController {
  constructor(private readonly service: WorkflowRunsService) {}

  @Get()
  async list(@CurrentUser() u: RequestUser, @Query("page") page = "1", @Query("limit") limit = "20", @Query("projectId") projectId?: string) {
    const res = await this.service.list(toObjectId(u.userId, "userId"), Number(page), Number(limit), projectId);
    return list(res.items, { page: Number(page), limit: Number(limit), total: res.total, hasMore: Number(page) * Number(limit) < res.total });
  }

  @Get(":id")
  async get(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.get(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Post(":id/pause")
  async pause(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.pause(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Post(":id/resume")
  async resume(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.resume(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Post(":id/stop")
  async stop(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.stop(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Get(":id/graph-state")
  async graphState(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.getGraphState(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Get(":id/logs")
  async logs(@CurrentUser() u: RequestUser, @Param("id") id: string, @Query("limit") limit = "200") {
    return ok(await this.service.getLogs(toObjectId(u.userId, "userId"), toObjectId(id), Number(limit)));
  }

  @Get(":id/issues")
  async issues(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.getIssues(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Get(":id/artifacts")
  async artifacts(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.getArtifacts(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Get(":id/events")
  async events(@CurrentUser() u: RequestUser, @Req() req: FastifyRequest, @Res() res: FastifyReply, @Param("id") id: string) {
    const userId = toObjectId(u.userId, "userId");
    const runId = toObjectId(id);
    const persisted = await this.service.getRecentEvents(userId, runId, 100);

    res.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    });

    for (const evt of persisted) {
      res.raw.write(`data: ${JSON.stringify(evt)}\n\n`);
    }

    const subscription = this.service.streamEvents(runId).subscribe({
      next: (event) => res.raw.write(`data: ${JSON.stringify(event)}\n\n`),
      error: () => res.raw.end()
    });

    const heartbeat = setInterval(() => res.raw.write(": heartbeat\n\n"), 25000);

    req.raw.on("close", () => {
      subscription.unsubscribe();
      clearInterval(heartbeat);
      res.raw.end();
    });
  }
}
