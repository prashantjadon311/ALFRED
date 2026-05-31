import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok, list } from "../../contracts/api-response.types";
import { WorkspaceScopeService } from "../workspaces/workspace-scope.service";
import { ArtifactsService } from "./artifacts.service";

const createSchema = z.object({ title: z.string().min(1).max(200), type: z.string(), content: z.string(), projectId: z.string().optional(), metadata: z.record(z.unknown()).optional() });
const updateSchema = createSchema.partial().omit({ projectId: true, type: true });
const exportSchema = z.object({ format: z.enum(["markdown", "json"]).default("markdown") });

@UseGuards(JwtAuthGuard)
@Controller("artifacts")
export class ArtifactsController {
  constructor(private readonly service: ArtifactsService, private readonly scope: WorkspaceScopeService) {}

  @Get()
  async list(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Query("page") page = "1", @Query("limit") limit = "20", @Query("projectId") projectId?: string, @Query("type") type?: string) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    const res = await this.service.list(userId, workspaceId, Number(page), Number(limit), projectId, type);
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

  @Get(":id/versions")
  async versions(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.getVersions(userId, workspaceId, toObjectId(id)));
  }

  @Get(":id/export")
  async exportGet(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string, @Query("format") format: "markdown" | "json" = "markdown") {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.export(userId, workspaceId, toObjectId(id), format));
  }

  @Post(":id/export")
  async export(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string, @Body(zodPipe(exportSchema)) body: z.infer<typeof exportSchema>) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.export(userId, workspaceId, toObjectId(id), body.format));
  }
}
