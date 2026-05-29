import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok } from "../../contracts/api-response.types";
import { SettingsService } from "./settings.service";

@UseGuards(JwtAuthGuard)
@Controller("settings")
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  async getAll(@CurrentUser() u: RequestUser) {
    return ok(await this.service.getAll(toObjectId(u.userId, "userId")));
  }

  @Patch()
  async setAll(@CurrentUser() u: RequestUser, @Body() body: Record<string, unknown>) {
    return ok(await this.service.setAll(toObjectId(u.userId, "userId"), body));
  }

  @Get(":key")
  async getKey(@CurrentUser() u: RequestUser, @Param("key") key: string) {
    return ok(await this.service.getKey(toObjectId(u.userId, "userId"), key));
  }

  @Patch(":key")
  async setKey(@CurrentUser() u: RequestUser, @Param("key") key: string, @Body() body: { value: unknown }) {
    return ok(await this.service.setKey(toObjectId(u.userId, "userId"), key, body.value));
  }
}
