import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { WorkflowRunsController } from "./workflow-runs.controller";
import { WorkflowRunsService } from "./workflow-runs.service";

@Module({
  imports: [RepositoriesModule, RealtimeModule],
  controllers: [WorkflowRunsController],
  providers: [WorkflowRunsService],
  exports: [WorkflowRunsService]
})
export class WorkflowRunsModule {}
