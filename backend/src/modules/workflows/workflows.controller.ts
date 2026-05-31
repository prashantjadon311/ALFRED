import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok, list } from "../../contracts/api-response.types";
import { WorkspaceScopeService } from "../workspaces/workspace-scope.service";
import { WorkflowsService } from "./workflows.service";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  projectId: z.string().optional(),
  workflowDsl: z.unknown().optional().default({}),
  maxIterations: z.number().int().min(1).max(10).optional(),
  maxTokens: z.number().int().min(1000).optional(),
  maxCostUsd: z.number().min(0.1).optional()
});
const updateSchema = createSchema.partial();
const runSchema = z.object({ projectId: z.string() });

@UseGuards(JwtAuthGuard)
@Controller("workflows")
export class WorkflowsController {
  constructor(private readonly service: WorkflowsService, private readonly scope: WorkspaceScopeService) {}

  @Get()
  async list(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Query("page") page = "1", @Query("limit") limit = "20", @Query("projectId") projectId?: string) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    const res = await this.service.list(userId, workspaceId, Number(page), Number(limit), projectId);
    return list(res.items, { page: Number(page), limit: Number(limit), total: res.total, hasMore: Number(page) * Number(limit) < res.total });
  }

  @Post()
  async create(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Body(zodPipe(createSchema)) body: z.infer<typeof createSchema>) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.create(userId, workspaceId, body));
  }

  @Get(":id")
  async get(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.get(userId, workspaceId, toObjectId(id)));
  }

  @Patch(":id")
  async update(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string, @Body(zodPipe(updateSchema)) body: z.infer<typeof updateSchema>) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.update(userId, workspaceId, toObjectId(id), body));
  }

  @Delete(":id")
  async remove(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.delete(userId, workspaceId, toObjectId(id)));
  }

  @Post(":id/validate")
  async validate(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.validate(userId, workspaceId, toObjectId(id)));
  }

  @Post(":id/run")
  async run(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string, @Body(zodPipe(runSchema)) body: z.infer<typeof runSchema>) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.run(userId, workspaceId, toObjectId(id), body.projectId));
  }
}
