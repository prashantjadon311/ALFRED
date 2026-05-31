import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../../repositories/repositories.module";
import { OrchestratorModule } from "../../orchestrator/orchestrator.module";
import { QueuesModule } from "../../queues/queues.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { WorkflowsController } from "./workflows.controller";
import { WorkflowsService } from "./workflows.service";

@Module({
  imports: [RepositoriesModule, OrchestratorModule, QueuesModule, WorkspacesModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService]
})
export class WorkflowsModule {}
