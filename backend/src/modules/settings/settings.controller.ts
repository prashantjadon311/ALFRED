import { Body, Controller, Get, Headers, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok } from "../../contracts/api-response.types";
import { WorkspaceScopeService } from "../workspaces/workspace-scope.service";
import { SettingsService } from "./settings.service";

const setKeySchema = z.object({
  value: z.unknown()
});

@UseGuards(JwtAuthGuard)
@Controller("settings")
export class SettingsController {
  constructor(
    private readonly service: SettingsService,
    private readonly scope: WorkspaceScopeService
  ) {}

  @Get()
  async getAll(
    @CurrentUser() u: RequestUser,
    @Headers("x-workspace-id") workspaceHeader: string | undefined,
    @Query("scope") settingScope?: string
  ) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.getAll(userId, workspaceId, settingScope));
  }

  @Patch()
  async setAll(
    @CurrentUser() u: RequestUser,
    @Headers("x-workspace-id") workspaceHeader: string | undefined,
    @Query("scope") settingScope: string | undefined,
    @Body() body: Record<string, unknown>
  ) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.setAll(userId, workspaceId, body, settingScope));
  }

  @Get(":key")
  async getKey(
    @CurrentUser() u: RequestUser,
    @Headers("x-workspace-id") workspaceHeader: string | undefined,
    @Param("key") key: string,
    @Query("scope") settingScope?: string
  ) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.getKey(userId, workspaceId, key, settingScope));
  }

  @Patch(":key")
  async setKey(
    @CurrentUser() u: RequestUser,
    @Headers("x-workspace-id") workspaceHeader: string | undefined,
    @Param("key") key: string,
    @Query("scope") settingScope: string | undefined,
    @Body(zodPipe(setKeySchema)) body: z.infer<typeof setKeySchema>
  ) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.setKey(userId, workspaceId, key, body.value, settingScope));
  }
}
