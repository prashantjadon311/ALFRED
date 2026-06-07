import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok, list } from "../../contracts/api-response.types";
import { WorkspaceScopeService } from "../workspaces/workspace-scope.service";
import { ProjectsService } from "./projects.service";

const createProjectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  type: z.enum(["software", "research", "planning", "mixed"]).default("software")
});
const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(["draft", "planning", "running", "waiting_approval", "paused", "completed", "failed", "needs_review"]).optional(),
  progress: z.number().min(0).max(100).optional()
});

function positiveIntParam(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

@UseGuards(JwtAuthGuard)
@Controller("projects")
export class ProjectsController {
  constructor(private readonly service: ProjectsService, private readonly scope: WorkspaceScopeService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Headers("x-workspace-id") workspaceHeader: string | undefined,
    @Query("page") pageParam?: string,
    @Query("limit") limitParam?: string,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("type") type?: string
  ) {
    const page = positiveIntParam(pageParam, 1);
    const limit = Math.min(positiveIntParam(limitParam, 20), 100);
    const userId = toObjectId(user.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    const result = await this.service.list(userId, workspaceId, page, limit, status, search, type);
    return list(result.items, { page, limit, total: result.total, hasMore: page * limit < result.total });
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Body(zodPipe(createProjectSchema)) body: z.infer<typeof createProjectSchema>) {
    const userId = toObjectId(user.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.create(userId, workspaceId, body));
  }

  @Get(":id/detail")
  async detail(@CurrentUser() user: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(user.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.detail(userId, workspaceId, toObjectId(id)));
  }

  @Get(":id")
  async get(@CurrentUser() user: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(user.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.get(userId, workspaceId, toObjectId(id)));
  }

  @Patch(":id")
  async update(@CurrentUser() user: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string, @Body(zodPipe(updateProjectSchema)) body: z.infer<typeof updateProjectSchema>) {
    const userId = toObjectId(user.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.update(userId, workspaceId, toObjectId(id), body));
  }

  @Delete(":id")
  async remove(@CurrentUser() user: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(user.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.delete(userId, workspaceId, toObjectId(id)));
  }

  @Get(":id/overview")
  async overview(@CurrentUser() user: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(user.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.overview(userId, workspaceId, toObjectId(id)));
  }

  @Get(":id/timeline")
  async timeline(@CurrentUser() user: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(user.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.timeline(userId, workspaceId, toObjectId(id)));
  }

  @Get(":id/usage")
  async usage(@CurrentUser() user: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(user.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.usageByProject(userId, workspaceId, toObjectId(id)));
  }

  @Get(":id/graph-state")
  async graphState(@CurrentUser() user: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(user.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.graphState(userId, workspaceId, toObjectId(id)));
  }
}
