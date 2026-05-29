import { Module } from "@nestjs/common";
import { OrchestratorModule } from "../orchestrator/orchestrator.module";
import { WorkflowQueue } from "./workflow.queue";
import { WorkflowProcessor } from "./workflow.processor";

@Module({ imports: [OrchestratorModule], providers: [WorkflowQueue, WorkflowProcessor], exports: [WorkflowQueue] })
export class QueuesModule {}
