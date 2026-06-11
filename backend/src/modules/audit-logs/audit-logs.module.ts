import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { AuditLogsController } from "./audit-logs.controller";

@Module({
  imports: [RepositoriesModule, WorkspacesModule],
  controllers: [AuditLogsController]
})
export class AuditLogsModule {}
