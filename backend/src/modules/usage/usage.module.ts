import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { UsageController } from "./usage.controller";
import { UsageService } from "./usage.service";

@Module({ imports: [RepositoriesModule], controllers: [UsageController], providers: [UsageService], exports: [UsageService] })
export class UsageModule {}
