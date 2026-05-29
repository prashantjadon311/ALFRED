import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { list } from "../../contracts/api-response.types";
import { AuditLogsRepository } from "../../repositories/audit-logs.repository";

@UseGuards(JwtAuthGuard)
@Controller("audit-logs")
export class AuditLogsController {
  constructor(private readonly repo: AuditLogsRepository) {}

  @Get()
  async list(@CurrentUser() u: RequestUser, @Query("page") page = "1", @Query("limit") limit = "50") {
    const res = await this.repo.listByUser(toObjectId(u.userId, "userId"), {} as any, { skip: (Number(page) - 1) * Number(limit), limit: Number(limit), sort: { createdAt: -1 } });
    return list(this.repo.serializeMany(res.items), { page: Number(page), limit: Number(limit), total: res.total, hasMore: Number(page) * Number(limit) < res.total });
  }
}
