import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { appConfig } from "./config/app.config";
import { authConfig } from "./config/auth.config";
import { budgetConfig } from "./config/budget.config";
import { llmConfig } from "./config/llm.config";
import { mongodbConfig } from "./config/mongodb.config";
import { redisConfig } from "./config/redis.config";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { DatabaseModule } from "./database/database.module";
import { RepositoriesModule } from "./repositories/repositories.module";
import { SecurityModule } from "./security/security.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { RequirementContractsModule } from "./modules/requirement-contracts/requirement-contracts.module";
import { ProjectMemoryModule } from "./modules/project-memory/project-memory.module";
import { ModelProvidersModule } from "./modules/model-providers/model-providers.module";
import { AiModelsModule } from "./modules/ai-models/ai-models.module";
import { AgentNodesModule } from "./modules/agent-nodes/agent-nodes.module";
import { UsersModule } from "./modules/users/users.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { ChatsModule } from "./modules/chats/chats.module";
import { PromptLibraryModule } from "./modules/prompt-library/prompt-library.module";
import { WorkflowsModule } from "./modules/workflows/workflows.module";
import { WorkflowRunsModule } from "./modules/workflow-runs/workflow-runs.module";
import { UsageModule } from "./modules/usage/usage.module";
import { ArtifactsModule } from "./modules/artifacts/artifacts.module";
import { ApprovalsModule } from "./modules/approvals/approvals.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { HealthModule } from "./modules/health/health.module";
import { LlmGatewayModule } from "./modules/llm-gateway/llm-gateway.module";
import { BudgetModule } from "./modules/budget/budget.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { OrchestratorModule } from "./orchestrator/orchestrator.module";
import { QueuesModule } from "./queues/queues.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig, authConfig, mongodbConfig, redisConfig, llmConfig, budgetConfig] }),
    DatabaseModule,
    RepositoriesModule,
    SecurityModule,
    AuthModule,
    ProjectsModule,
    RequirementContractsModule,
    ProjectMemoryModule,
    ModelProvidersModule,
    AiModelsModule,
    AgentNodesModule,
    UsersModule,
    AuditLogsModule,
    ChatsModule,
    PromptLibraryModule,
    LlmGatewayModule,
    BudgetModule,
    UsageModule,
    RealtimeModule,
    OrchestratorModule,
    WorkflowsModule,
    WorkflowRunsModule,
    QueuesModule,
    ArtifactsModule,
    ApprovalsModule,
    SettingsModule,
    DashboardModule,
    HealthModule
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
