import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { QueuesModule } from "../../queues/queues.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { WorkflowRunsController } from "./workflow-runs.controller";
import { WorkflowRunsService } from "./workflow-runs.service";

@Module({
  imports: [RepositoriesModule, RealtimeModule, WorkspacesModule, QueuesModule],
  controllers: [WorkflowRunsController],
  providers: [WorkflowRunsService],
  exports: [WorkflowRunsService]
})
export class WorkflowRunsModule {}
