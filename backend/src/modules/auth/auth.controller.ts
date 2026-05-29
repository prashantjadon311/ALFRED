import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { ok } from "../../contracts/api-response.types";
import { AuthService } from "./auth.service";
import { loginSchema, refreshSchema, registerSchema } from "./auth.schemas";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post("register") async register(@Body(zodPipe(registerSchema)) body: any) { return ok(await this.auth.register(body)); }
  @Post("login") async login(@Body(zodPipe(loginSchema)) body: any) { return ok(await this.auth.login(body)); }
  @Post("refresh") async refresh(@Body(zodPipe(refreshSchema)) body: any) { return ok(await this.auth.refresh(body.refreshToken)); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Post("logout") async logout(@CurrentUser() user: any) { await this.auth.logout(user.userId); return ok({ loggedOut: true }); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Get("me") async me(@CurrentUser() user: any) { return ok(await this.auth.me(user.userId)); }
}
