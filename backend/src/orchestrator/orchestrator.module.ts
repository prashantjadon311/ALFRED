import { Module } from "@nestjs/common";
import { RepositoriesModule } from "../repositories/repositories.module";
import { LlmGatewayModule } from "../modules/llm-gateway/llm-gateway.module";
import { BudgetModule } from "../modules/budget/budget.module";
import { UsageModule } from "../modules/usage/usage.module";
import { RealtimeModule } from "../modules/realtime/realtime.module";
import { WorkflowOrchestratorService } from "./workflow-orchestrator.service";
import { WorkflowDslValidatorService } from "./workflow-dsl.validator";
import { WorkflowContextBuilderService } from "./workflow-context-builder.service";
import { AgentPromptBuilderService } from "./agent-prompt-builder.service";
import { StructuredOutputParserService } from "./structured-output-parser.service";
import { RequirementDriftService } from "./requirement-drift.service";
import { CritiqueResolutionService } from "./critique-resolution.service";
import { WorkflowStateMachine } from "./workflow-state-machine";
import { PricingModule } from "../modules/pricing/pricing.module";

@Module({
  imports: [RepositoriesModule, LlmGatewayModule, BudgetModule, UsageModule, RealtimeModule, PricingModule],
  providers: [WorkflowOrchestratorService, WorkflowDslValidatorService, WorkflowContextBuilderService, AgentPromptBuilderService, StructuredOutputParserService, RequirementDriftService, CritiqueResolutionService, WorkflowStateMachine],
  exports: [WorkflowOrchestratorService, WorkflowDslValidatorService, StructuredOutputParserService, RequirementDriftService, WorkflowStateMachine]
})
export class OrchestratorModule {}
