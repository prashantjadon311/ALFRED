import { Module } from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { ProjectsRepository } from "./projects.repository";
import { RequirementContractsRepository } from "./requirement-contracts.repository";
import { ProjectMemoryRepository } from "./project-memory.repository";
import { ModelProvidersRepository } from "./model-providers.repository";
import { AiModelsRepository } from "./ai-models.repository";
import { ChatsRepository } from "./chats.repository";
import { MessagesRepository } from "./messages.repository";
import { PromptsRepository } from "./prompts.repository";
import { WorkflowsRepository } from "./workflows.repository";
import { WorkflowRunsRepository } from "./workflow-runs.repository";
import { AgentNodesRepository } from "./agent-nodes.repository";
import { AgentExecutionsRepository } from "./agent-executions.repository";
import { AgentMessagesRepository } from "./agent-messages.repository";
import { AgentDecisionsRepository } from "./agent-decisions.repository";
import { CritiqueIssuesRepository } from "./critique-issues.repository";
import { RevisionPatchesRepository } from "./revision-patches.repository";
import { WorkflowEventsRepository } from "./workflow-events.repository";
import { UsageEventsRepository } from "./usage-events.repository";
import { ArtifactsRepository } from "./artifacts.repository";
import { ArtifactVersionsRepository } from "./artifact-versions.repository";
import { ApprovalRequestsRepository } from "./approval-requests.repository";
import { SettingsRepository } from "./settings.repository";
import { AuditLogsRepository } from "./audit-logs.repository";
import { WorkspacesRepository } from "./workspaces.repository";

export const repositoryProviders = [UsersRepository, WorkspacesRepository, ProjectsRepository, RequirementContractsRepository, ProjectMemoryRepository, ModelProvidersRepository, AiModelsRepository, ChatsRepository, MessagesRepository, PromptsRepository, WorkflowsRepository, WorkflowRunsRepository, AgentNodesRepository, AgentExecutionsRepository, AgentMessagesRepository, AgentDecisionsRepository, CritiqueIssuesRepository, RevisionPatchesRepository, WorkflowEventsRepository, UsageEventsRepository, ArtifactsRepository, ArtifactVersionsRepository, ApprovalRequestsRepository, SettingsRepository, AuditLogsRepository];

@Module({ providers: repositoryProviders, exports: repositoryProviders })
export class RepositoriesModule {}
