import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok, list } from "../../contracts/api-response.types";
import { ApprovalsService } from "./approvals.service";

const decisionSchema = z.object({ reason: z.string().max(2000).optional() });

@UseGuards(JwtAuthGuard)
@Controller("approvals")
export class ApprovalsController {
  constructor(private readonly service: ApprovalsService) {}

  @Get()
  async list(@CurrentUser() u: RequestUser, @Query("page") page = "1", @Query("limit") limit = "20", @Query("status") status?: string) {
    const res = await this.service.list(toObjectId(u.userId, "userId"), Number(page), Number(limit), status);
    return list(res.items, { page: Number(page), limit: Number(limit), total: res.total, hasMore: Number(page) * Number(limit) < res.total });
  }

  @Get(":id")
  async get(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.get(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Post(":id/approve")
  async approve(@CurrentUser() u: RequestUser, @Param("id") id: string, @Body(zodPipe(decisionSchema)) body: z.infer<typeof decisionSchema>) {
    return ok(await this.service.approve(toObjectId(u.userId, "userId"), toObjectId(id), body.reason));
  }

  @Post(":id/reject")
  async reject(@CurrentUser() u: RequestUser, @Param("id") id: string, @Body(zodPipe(decisionSchema)) body: z.infer<typeof decisionSchema>) {
    return ok(await this.service.reject(toObjectId(u.userId, "userId"), toObjectId(id), body.reason));
  }
}
