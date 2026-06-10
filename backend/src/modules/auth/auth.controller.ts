import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { ok } from "../../contracts/api-response.types";
import { AuthService } from "./auth.service";
import { loginSchema, registerSchema } from "./auth.schemas";
import { AuthCookieService } from "./auth-cookie.service";
import { AuthOriginGuard } from "./auth-origin.guard";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly cookies: AuthCookieService) {}

  @Post("register")
  async register(@Body(zodPipe(registerSchema)) body: any, @Res({ passthrough: true }) reply: FastifyReply) {
    const { refreshToken, ...response } = await this.auth.register(body);
    this.cookies.setRefreshCookie(reply, refreshToken);
    return ok(response);
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body(zodPipe(loginSchema)) body: any, @Res({ passthrough: true }) reply: FastifyReply) {
    const { refreshToken, ...response } = await this.auth.login(body);
    this.cookies.setRefreshCookie(reply, refreshToken);
    return ok(response);
  }

  @Post("refresh")
  @HttpCode(200)
  @UseGuards(AuthOriginGuard)
  async refresh(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const { refreshToken, ...response } = await this.auth.refresh(this.cookies.requireRefreshToken(request));
    this.cookies.setRefreshCookie(reply, refreshToken);
    return ok(response);
  }

  @Post("logout")
  @HttpCode(200)
  @UseGuards(AuthOriginGuard)
  async logout(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    await this.auth.logoutByRefreshToken(this.cookies.getRefreshToken(request));
    this.cookies.clearRefreshCookie(reply);
    return ok({ loggedOut: true });
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Get("me") async me(@CurrentUser() user: any) { return ok(await this.auth.me(user.userId)); }
}
