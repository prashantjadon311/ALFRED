import { Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok, list } from "../../contracts/api-response.types";
import { WorkspaceScopeService } from "../workspaces/workspace-scope.service";
import { WorkflowRunsService } from "./workflow-runs.service";

@UseGuards(JwtAuthGuard)
@Controller("workflow-runs")
export class WorkflowRunsController {
  constructor(private readonly service: WorkflowRunsService, private readonly scope: WorkspaceScopeService) {}

  @Get()
  async list(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Query("page") page = "1", @Query("limit") limit = "20", @Query("projectId") projectId?: string) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    const res = await this.service.list(userId, workspaceId, Number(page), Number(limit), projectId);
    return list(res.items, { page: Number(page), limit: Number(limit), total: res.total, hasMore: Number(page) * Number(limit) < res.total });
  }

  @Get(":id")
  async get(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(u.userId, "userId");
    return ok(await this.service.get(userId, await this.scope.resolve(userId, workspaceHeader), toObjectId(id)));
  }

  @Post(":id/pause")
  async pause(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(u.userId, "userId");
    return ok(await this.service.pause(userId, await this.scope.resolve(userId, workspaceHeader), toObjectId(id)));
  }

  @Post(":id/resume")
  async resume(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(u.userId, "userId");
    return ok(await this.service.resume(userId, await this.scope.resolve(userId, workspaceHeader), toObjectId(id)));
  }

  @Post(":id/stop")
  async stop(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(u.userId, "userId");
    return ok(await this.service.stop(userId, await this.scope.resolve(userId, workspaceHeader), toObjectId(id)));
  }

  @Get(":id/graph-state")
  async graphState(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(u.userId, "userId");
    return ok(await this.service.getGraphState(userId, await this.scope.resolve(userId, workspaceHeader), toObjectId(id)));
  }

  @Get(":id/logs")
  async logs(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string, @Query("limit") limit = "200") {
    const userId = toObjectId(u.userId, "userId");
    return ok(await this.service.getLogs(userId, await this.scope.resolve(userId, workspaceHeader), toObjectId(id), Number(limit)));
  }

  @Get(":id/issues")
  async issues(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(u.userId, "userId");
    return ok(await this.service.getIssues(userId, await this.scope.resolve(userId, workspaceHeader), toObjectId(id)));
  }

  @Get(":id/artifacts")
  async artifacts(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(u.userId, "userId");
    return ok(await this.service.getArtifacts(userId, await this.scope.resolve(userId, workspaceHeader), toObjectId(id)));
  }

  @Get(":id/events")
  async events(
    @CurrentUser() u: RequestUser,
    @Headers("x-workspace-id") workspaceHeader: string | undefined,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Param("id") id: string,
    @Query("limit") limit = "100",
    @Query("stream") stream?: string
  ) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    const runId = toObjectId(id);
    const persisted = await this.service.getRecentEvents(userId, workspaceId, runId, Number(limit));
    const wantsStream = stream === "true" || String(req.headers.accept ?? "").includes("text/event-stream");

    if (!wantsStream) {
      return res.send(ok(persisted));
    }

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
