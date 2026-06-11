import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok, list } from "../../contracts/api-response.types";
import { WorkspaceScopeService } from "../workspaces/workspace-scope.service";
import { ApprovalsService } from "./approvals.service";

const decisionSchema = z.object({ reason: z.string().max(2000).optional() });

@UseGuards(JwtAuthGuard)
@Controller("approvals")
export class ApprovalsController {
  constructor(
    private readonly service: ApprovalsService,
    private readonly scope: WorkspaceScopeService
  ) {}

  @Get()
  async list(
    @CurrentUser() u: RequestUser,
    @Headers("x-workspace-id") workspaceHeader: string | undefined,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
    @Query("status") status?: string
  ) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    const res = await this.service.list(userId, workspaceId, Number(page), Number(limit), status);
    return list(res.items, { page: Number(page), limit: Number(limit), total: res.total, hasMore: Number(page) * Number(limit) < res.total });
  }

  @Get(":id")
  async get(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.get(userId, workspaceId, toObjectId(id)));
  }

  @Post(":id/approve")
  async approve(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string, @Body(zodPipe(decisionSchema)) body: z.infer<typeof decisionSchema>) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.approve(userId, workspaceId, toObjectId(id), body.reason));
  }

  @Post(":id/reject")
  async reject(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string, @Body(zodPipe(decisionSchema)) body: z.infer<typeof decisionSchema>) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.reject(userId, workspaceId, toObjectId(id), body.reason));
  }
}
