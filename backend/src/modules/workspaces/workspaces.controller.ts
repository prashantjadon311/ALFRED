import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { list, ok } from "../../contracts/api-response.types";
import { WorkspacesService } from "./workspaces.service";

const workspaceSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  plan: z.string().max(80).optional(),
  active: z.boolean().optional(),
  defaultProvider: z.string().max(120).optional(),
  defaultModel: z.string().max(120).optional(),
  monthlyTokenLimit: z.number().int().min(0).optional(),
  monthlyCostLimit: z.number().min(0).optional(),
  themePreference: z.enum(["dark", "light", "system"]).optional()
});
const updateWorkspaceSchema = workspaceSchema.partial().extend({ archived: z.boolean().optional() });

@UseGuards(JwtAuthGuard)
@Controller("workspaces")
export class WorkspacesController {
  constructor(private readonly service: WorkspacesService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser, @Query("page") page = "1", @Query("limit") limit = "20", @Query("includeArchived") includeArchived = "false") {
    const result = await this.service.list(toObjectId(user.userId, "userId"), Number(page), Number(limit), includeArchived === "true");
    return list(result.items, { page: Number(page), limit: Number(limit), total: result.total, hasMore: Number(page) * Number(limit) < result.total });
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body(zodPipe(workspaceSchema)) body: z.infer<typeof workspaceSchema>) {
    return ok(await this.service.create(toObjectId(user.userId, "userId"), body));
  }

  @Get(":id")
  async get(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return ok(await this.service.get(toObjectId(user.userId, "userId"), toObjectId(id)));
  }

  @Patch(":id")
  async update(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body(zodPipe(updateWorkspaceSchema)) body: z.infer<typeof updateWorkspaceSchema>) {
    return ok(await this.service.update(toObjectId(user.userId, "userId"), toObjectId(id), body));
  }

  @Delete(":id")
  async remove(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return ok(await this.service.archive(toObjectId(user.userId, "userId"), toObjectId(id)));
  }

  @Post(":id/switch")
  async switchWorkspace(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return ok(await this.service.switchWorkspace(toObjectId(user.userId, "userId"), toObjectId(id)));
  }
}
