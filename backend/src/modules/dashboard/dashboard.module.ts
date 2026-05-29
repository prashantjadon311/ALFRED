import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { UsageModule } from "../usage/usage.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [RepositoriesModule, UsageModule],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
