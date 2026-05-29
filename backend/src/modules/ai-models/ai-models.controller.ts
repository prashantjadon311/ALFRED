import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok, list } from "../../contracts/api-response.types";
import { AiModelsService } from "./ai-models.service";

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  defaultRole: z.string().max(60).optional(),
  displayName: z.string().max(80).optional(),
  inputCostPer1k: z.number().min(0).optional(),
  outputCostPer1k: z.number().min(0).optional()
});

@UseGuards(JwtAuthGuard)
@Controller("models")
export class AiModelsController {
  constructor(private readonly service: AiModelsService) {}

  @Get()
  async list(@CurrentUser() u: RequestUser, @Query("page") page = "1", @Query("limit") limit = "50", @Query("providerId") providerId?: string) {
    const res = await this.service.list(toObjectId(u.userId, "userId"), Number(page), Number(limit), providerId);
    return list(res.items, { page: Number(page), limit: Number(limit), total: res.total, hasMore: Number(page) * Number(limit) < res.total });
  }

  @Patch(":id")
  async update(@CurrentUser() u: RequestUser, @Param("id") id: string, @Body(zodPipe(updateSchema)) body: z.infer<typeof updateSchema>) {
    return ok(await this.service.update(toObjectId(u.userId, "userId"), toObjectId(id), body));
  }
}
