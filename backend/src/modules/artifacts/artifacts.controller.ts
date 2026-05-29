import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok, list } from "../../contracts/api-response.types";
import { ArtifactsService } from "./artifacts.service";

const createSchema = z.object({ title: z.string().min(1).max(200), type: z.string(), content: z.string(), projectId: z.string().optional(), metadata: z.record(z.unknown()).optional() });
const updateSchema = createSchema.partial().omit({ projectId: true, type: true });
const exportSchema = z.object({ format: z.enum(["markdown", "json"]).default("markdown") });

@UseGuards(JwtAuthGuard)
@Controller("artifacts")
export class ArtifactsController {
  constructor(private readonly service: ArtifactsService) {}

  @Get()
  async list(@CurrentUser() u: RequestUser, @Query("page") page = "1", @Query("limit") limit = "20", @Query("projectId") projectId?: string, @Query("type") type?: string) {
    const res = await this.service.list(toObjectId(u.userId, "userId"), Number(page), Number(limit), projectId, type);
    return list(res.items, { page: Number(page), limit: Number(limit), total: res.total, hasMore: Number(page) * Number(limit) < res.total });
  }

  @Post()
  async create(@CurrentUser() u: RequestUser, @Body(zodPipe(createSchema)) body: z.infer<typeof createSchema>) {
    return ok(await this.service.create(toObjectId(u.userId, "userId"), body));
  }

  @Get(":id")
  async get(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.get(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Patch(":id")
  async update(@CurrentUser() u: RequestUser, @Param("id") id: string, @Body(zodPipe(updateSchema)) body: z.infer<typeof updateSchema>) {
    return ok(await this.service.update(toObjectId(u.userId, "userId"), toObjectId(id), body));
  }

  @Delete(":id")
  async remove(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.delete(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Get(":id/versions")
  async versions(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.getVersions(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Get(":id/export")
  async exportGet(@CurrentUser() u: RequestUser, @Param("id") id: string, @Query("format") format: "markdown" | "json" = "markdown") {
    return ok(await this.service.export(toObjectId(u.userId, "userId"), toObjectId(id), format));
  }

  @Post(":id/export")
  async export(@CurrentUser() u: RequestUser, @Param("id") id: string, @Body(zodPipe(exportSchema)) body: z.infer<typeof exportSchema>) {
    return ok(await this.service.export(toObjectId(u.userId, "userId"), toObjectId(id), body.format));
  }
}
