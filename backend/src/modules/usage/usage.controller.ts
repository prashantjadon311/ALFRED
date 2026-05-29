import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ObjectId } from "mongodb";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ok } from "../../contracts/api-response.types";
import { UsageService } from "./usage.service";

@ApiTags("Usage")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("usage")
export class UsageController {
  constructor(private readonly usage: UsageService) {}
  @Get("summary") async summary(@CurrentUser() user: any) { return ok(await this.usage.summary(new ObjectId(user.userId))); }
  @Get("by-provider") async byProvider(@CurrentUser() user: any) { return ok(await this.usage.byProvider(new ObjectId(user.userId))); }
  @Get("by-project") async byProject(@CurrentUser() user: any) { return ok(await this.usage.byProject(new ObjectId(user.userId))); }
  @Get("by-model") async byModel(@CurrentUser() user: any) { return ok(await this.usage.byModel(new ObjectId(user.userId))); }
  @Get("daily") async daily(@CurrentUser() user: any) { return ok(await this.usage.daily(new ObjectId(user.userId))); }
  @Get("budget-alerts") async alerts(@CurrentUser() user: any) { return ok(await this.usage.budgetAlerts(new ObjectId(user.userId))); }
}
