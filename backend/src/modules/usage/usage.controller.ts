import { Controller, Get, Headers, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ObjectId } from "mongodb";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ok } from "../../contracts/api-response.types";
import { WorkspaceScopeService } from "../workspaces/workspace-scope.service";
import { UsageService } from "./usage.service";

@ApiTags("Usage")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("usage")
export class UsageController {
  constructor(private readonly usage: UsageService, private readonly scope: WorkspaceScopeService) {}
  @Get("summary") async summary(@CurrentUser() user: any, @Headers("x-workspace-id") workspaceHeader: string | undefined) { const userId = new ObjectId(user.userId); return ok(await this.usage.summary(userId, await this.scope.resolve(userId, workspaceHeader))); }
  @Get("by-provider") async byProvider(@CurrentUser() user: any, @Headers("x-workspace-id") workspaceHeader: string | undefined) { const userId = new ObjectId(user.userId); return ok(await this.usage.byProvider(userId, await this.scope.resolve(userId, workspaceHeader))); }
  @Get("by-project") async byProject(@CurrentUser() user: any, @Headers("x-workspace-id") workspaceHeader: string | undefined) { const userId = new ObjectId(user.userId); return ok(await this.usage.byProject(userId, await this.scope.resolve(userId, workspaceHeader))); }
  @Get("by-model") async byModel(@CurrentUser() user: any, @Headers("x-workspace-id") workspaceHeader: string | undefined) { const userId = new ObjectId(user.userId); return ok(await this.usage.byModel(userId, await this.scope.resolve(userId, workspaceHeader))); }
  @Get("daily") async daily(@CurrentUser() user: any, @Headers("x-workspace-id") workspaceHeader: string | undefined) { const userId = new ObjectId(user.userId); return ok(await this.usage.daily(userId, await this.scope.resolve(userId, workspaceHeader))); }
  @Get("budget-alerts") async alerts(@CurrentUser() user: any, @Headers("x-workspace-id") workspaceHeader: string | undefined) { const userId = new ObjectId(user.userId); return ok(await this.usage.budgetAlerts(userId, await this.scope.resolve(userId, workspaceHeader))); }
}
