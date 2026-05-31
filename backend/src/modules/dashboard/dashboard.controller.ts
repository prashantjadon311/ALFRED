import { Controller, Get, Headers, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok } from "../../contracts/api-response.types";
import { WorkspaceScopeService } from "../workspaces/workspace-scope.service";
import { DashboardService } from "./dashboard.service";

@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly service: DashboardService, private readonly scope: WorkspaceScopeService) {}

  @Get("summary")
  async summary(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined) {
    const userId = toObjectId(u.userId, "userId");
    return ok(await this.service.summary(userId, await this.scope.resolve(userId, workspaceHeader)));
  }
}
