import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserProvisioningService } from "./user-provisioning.service";
import { AuthCookieService } from "./auth-cookie.service";
import { AuthOriginGuard } from "./auth-origin.guard";

@Module({ imports: [RepositoriesModule, JwtModule.register({ global: true })], controllers: [AuthController], providers: [AuthService, UserProvisioningService, AuthCookieService, AuthOriginGuard], exports: [AuthService, JwtModule] })
export class AuthModule {}
