import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok, list } from "../../contracts/api-response.types";
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

@UseGuards(JwtAuthGuard)
@Controller("projects")
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser, @Query("page") page = "1", @Query("limit") limit = "20", @Query("status") status?: string) {
    const result = await this.service.list(toObjectId(user.userId, "userId"), Number(page), Number(limit), status);
    return list(result.items, { page: Number(page), limit: Number(limit), total: result.total, hasMore: Number(page) * Number(limit) < result.total });
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body(zodPipe(createProjectSchema)) body: z.infer<typeof createProjectSchema>) {
    return ok(await this.service.create(toObjectId(user.userId, "userId"), body));
  }

  @Get(":id")
  async get(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return ok(await this.service.get(toObjectId(user.userId, "userId"), toObjectId(id)));
  }

  @Patch(":id")
  async update(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body(zodPipe(updateProjectSchema)) body: z.infer<typeof updateProjectSchema>) {
    return ok(await this.service.update(toObjectId(user.userId, "userId"), toObjectId(id), body));
  }

  @Delete(":id")
  async remove(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return ok(await this.service.delete(toObjectId(user.userId, "userId"), toObjectId(id)));
  }

  @Get(":id/overview")
  async overview(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return ok(await this.service.overview(toObjectId(user.userId, "userId"), toObjectId(id)));
  }

  @Get(":id/timeline")
  async timeline(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return ok(await this.service.timeline(toObjectId(user.userId, "userId"), toObjectId(id)));
  }

  @Get(":id/usage")
  async usage(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return ok(await this.service.usageByProject(toObjectId(user.userId, "userId"), toObjectId(id)));
  }

  @Get(":id/graph-state")
  async graphState(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return ok(await this.service.graphState(toObjectId(user.userId, "userId"), toObjectId(id)));
  }
}
