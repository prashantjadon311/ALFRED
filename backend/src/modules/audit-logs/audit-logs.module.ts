import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { AuditLogsController } from "./audit-logs.controller";

@Module({
  imports: [RepositoriesModule],
  controllers: [AuditLogsController]
})
export class AuditLogsModule {}
