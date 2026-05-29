import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({ imports: [RepositoriesModule, JwtModule.register({ global: true })], controllers: [AuthController], providers: [AuthService], exports: [AuthService, JwtModule] })
export class AuthModule {}
