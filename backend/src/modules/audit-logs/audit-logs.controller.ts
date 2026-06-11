import { Controller, Get, Headers, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { list } from "../../contracts/api-response.types";
import { AuditLogsRepository } from "../../repositories/audit-logs.repository";
import { WorkspaceScopeService } from "../workspaces/workspace-scope.service";

@UseGuards(JwtAuthGuard)
@Controller("audit-logs")
export class AuditLogsController {
  constructor(
    private readonly repo: AuditLogsRepository,
    private readonly scope: WorkspaceScopeService
  ) {}

  @Get()
  async list(
    @CurrentUser() u: RequestUser,
    @Headers("x-workspace-id") workspaceHeader: string | undefined,
    @Query("page") page = "1",
    @Query("limit") limit = "50",
    @Query("scope") auditScope = "workspace"
  ) {
    const userId = toObjectId(u.userId, "userId");
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const res = auditScope === "user"
      ? await this.repo.listUserScope(userId, skip, limitNumber)
      : auditScope === "all"
        ? await this.repo.listAllForUser(userId, skip, limitNumber)
        : await this.repo.listWorkspace(
          userId,
          await this.scope.resolve(userId, workspaceHeader),
          skip,
          limitNumber
        );

    return list(this.repo.serializeMany(res.items), {
      page: pageNumber,
      limit: limitNumber,
      total: res.total,
      hasMore: pageNumber * limitNumber < res.total
    });
  }
}
