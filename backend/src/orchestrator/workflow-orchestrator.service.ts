import { Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { WorkflowEventType } from "../contracts/workflow-event.types";
import { WorkflowDsl, WorkflowDslEdge, WorkflowDslNode } from "../contracts/workflow-dsl.types";
import { BudgetService } from "../modules/budget/budget.service";
import { RealtimeEventBus } from "../modules/realtime/realtime-event-bus.service";
import { UsageService } from "../modules/usage/usage.service";
import { LlmRouterService } from "../llm/llm-router.service";
import { ProjectsRepository } from "../repositories/projects.repository";
import { WorkflowsRepository } from "../repositories/workflows.repository";
import { WorkflowRunsRepository, WorkflowRunDoc } from "../repositories/workflow-runs.repository";
import { RequirementContractsRepository } from "../repositories/requirement-contracts.repository";
import { ProjectMemoryRepository } from "../repositories/project-memory.repository";
import { AgentExecutionsRepository } from "../repositories/agent-executions.repository";
import { AgentMessagesRepository } from "../repositories/agent-messages.repository";
import { AgentDecisionsRepository } from "../repositories/agent-decisions.repository";
import { CritiqueIssuesRepository } from "../repositories/critique-issues.repository";
import { RevisionPatchesRepository } from "../repositories/revision-patches.repository";
import { WorkflowEventsRepository } from "../repositories/workflow-events.repository";
import { ArtifactsRepository } from "../repositories/artifacts.repository";
import { ArtifactVersionsRepository } from "../repositories/artifact-versions.repository";
import { ApprovalRequestsRepository } from "../repositories/approval-requests.repository";
import { WorkflowDslValidatorService } from "./workflow-dsl.validator";
import { StructuredOutputParserService } from "./structured-output-parser.service";
import { RequirementDriftService } from "./requirement-drift.service";
import { AgentPromptBuilderService } from "./agent-prompt-builder.service";
import { WorkflowContextBuilderService } from "./workflow-context-builder.service";
import { CritiqueResolutionService } from "./critique-resolution.service";
import { PricingService } from "../modules/pricing/pricing.service";

export interface WorkflowTraversalState {
  iteration: number;
  maxIterations: number;
  previousOutputs: unknown[];
  lastCriticOutput?: any;
  lastCriticIssues: Array<{ severity?: string }>;
  openBlockingIssues: Array<{ severity?: string }>;
  openIssueDocs: any[];
  taskType?: string;
  completed: boolean;
  finalArtifactCreated: boolean;
}

export function getNode(dsl: WorkflowDsl, nodeKey: string) {
  return dsl.nodes.find((node) => node.key === nodeKey);
}

export function getOutgoingEdges(dsl: WorkflowDsl, nodeKey: string) {
  return dsl.edges.filter((edge) => edge.from === nodeKey);
}

export function findStartNode(dsl: WorkflowDsl) {
  const requirementLock = dsl.nodes.find((node) => node.type === "requirement_lock");
  if (requirementLock) return requirementLock;
  const incoming = new Set(dsl.edges.map((edge) => edge.to));
  return dsl.nodes.find((node) => !incoming.has(node.key));
}

export function evaluateEdgeCondition(edge: WorkflowDslEdge, state: Pick<WorkflowTraversalState, "iteration" | "maxIterations" | "lastCriticOutput" | "lastCriticIssues" | "openBlockingIssues" | "taskType">) {
  if (!edge.condition) return true;
  switch (edge.condition.type) {
    case "has_issue_severity": {
      const severities = edge.condition.severityIn ?? [];
      return state.lastCriticIssues.some((issue) => issue.severity ? severities.includes(issue.severity as any) : false);
    }
    case "iteration_remaining":
      return state.iteration < state.maxIterations;
    case "critic_approved": {
      const verdict = String(state.lastCriticOutput?.verdict ?? "").toLowerCase();
      return state.openBlockingIssues.length === 0 && (verdict === "approved" || !hasSeverity(state.lastCriticIssues, ["BLOCKER", "HIGH"]));
    }
    case "task_type_in":
      return Boolean(state.taskType && (edge.condition.values ?? []).includes(state.taskType));
    default:
      return false;
  }
}

export function selectNextEdge(dsl: WorkflowDsl, nodeKey: string, state: WorkflowTraversalState) {
  return getOutgoingEdges(dsl, nodeKey).find((edge) => evaluateEdgeCondition(edge, state));
}

export function shouldRequestHumanReviewForMaxIteration(currentNode: WorkflowDslNode, nextEdge: WorkflowDslEdge, state: Pick<WorkflowTraversalState, "iteration" | "maxIterations" | "openBlockingIssues">) {
  return (currentNode.type === "critic" || currentNode.key === "claude_critic") && nextEdge.to !== "final_output" && state.openBlockingIssues.length > 0 && state.iteration >= state.maxIterations;
}

function hasSeverity(issues: Array<{ severity?: string }>, severities: string[]) {
  return issues.some((issue) => issue.severity ? severities.includes(issue.severity) : false);
}

function shouldExitProcessing(status?: string) {
  return Boolean(status && ["paused", "stopped", "failed", "completed", "needs_human_review"].includes(status));
}

@Injectable()
export class WorkflowOrchestratorService {
  constructor(
    private readonly projects: ProjectsRepository,
    private readonly workflows: WorkflowsRepository,
    private readonly runs: WorkflowRunsRepository,
    private readonly requirements: RequirementContractsRepository,
    private readonly memory: ProjectMemoryRepository,
    private readonly executions: AgentExecutionsRepository,
    private readonly agentMessages: AgentMessagesRepository,
    private readonly decisions: AgentDecisionsRepository,
    private readonly issues: CritiqueIssuesRepository,
    private readonly patches: RevisionPatchesRepository,
    private readonly events: WorkflowEventsRepository,
    private readonly artifacts: ArtifactsRepository,
    private readonly versions: ArtifactVersionsRepository,
    private readonly approvals: ApprovalRequestsRepository,
    private readonly validator: WorkflowDslValidatorService,
    private readonly parser: StructuredOutputParserService,
    private readonly drift: RequirementDriftService,
    private readonly promptBuilder: AgentPromptBuilderService,
    private readonly contextBuilder: WorkflowContextBuilderService,
    private readonly resolver: CritiqueResolutionService,
    private readonly llm: LlmRouterService,
    private readonly budget: BudgetService,
    private readonly pricing: PricingService,
    private readonly usage: UsageService,
    private readonly bus: RealtimeEventBus
  ) {}

  async startRun(userId: ObjectId, workspaceId: ObjectId, workflowId: ObjectId, projectId: ObjectId) {
    const [workflow, project, requirement] = await Promise.all([
      this.workflows.findByIdForWorkspace(workflowId, userId, workspaceId),
      this.projects.findByIdForWorkspace(projectId, userId, workspaceId),
      this.requirements.findCurrent(userId, projectId)
    ]);
    if (!workflow || !project || !requirement) throw new NotFoundException("Workflow, project, or requirement contract not found");
    const workflowDsl = this.validator.validate(workflow.workflowDsl);
    const budgetState = this.budget.buildSnapshot(workflow.maxTokens, 0, workflow.maxCostUsd, 0);
    const run = await this.runs.create({
      userId, workspaceId, projectId, workflowId, status: "queued", iteration: 1, maxIterations: workflow.maxIterations,
      totalInputTokens: 0, totalOutputTokens: 0, totalCostUsd: 0, budgetState, requirementContractSnapshot: requirement,
      workflowDslSnapshot: workflowDsl, acceptedDecisions: [], rejectedIdeas: [], openIssues: [], version: 1, createdAt: new Date()
    } as any);
    await this.emit(userId, run!._id!, "run.queued", { projectId, message: "Workflow queued", data: { status: "queued" } });
    return run!;
  }

  async processRun(workflowRunId: string, userIdString: string) {
    const userId = new ObjectId(userIdString);
    const runId = new ObjectId(workflowRunId);
    const run = await this.runs.findById(runId, userId);
    if (!run || run.status === "running" || shouldExitProcessing(run.status)) return run;
    const dsl = run.workflowDslSnapshot;
    const requirement = run.requirementContractSnapshot as any;
    const startedAt = run.startedAt ?? new Date();
    await this.runs.updateStatus(runId, userId, "running", { startedAt });
    await this.emit(userId, runId, "run.started", { projectId: run.projectId, message: "Workflow started", data: { status: "running" } });
    await this.emit(userId, runId, "run.running", { projectId: run.projectId, data: { status: "running" } });

    const state: WorkflowTraversalState = {
      iteration: run.iteration ?? 1,
      maxIterations: run.maxIterations,
      previousOutputs: [],
      lastCriticIssues: [],
      openBlockingIssues: [],
      openIssueDocs: [],
      taskType: requirement.taskType,
      completed: false,
      finalArtifactCreated: false
    };

    let currentNode: WorkflowDslNode | undefined = run.currentNodeKey ? getNode(dsl, run.currentNodeKey) : findStartNode(dsl);
    if (!currentNode) {
      await this.requestHumanReview(userId, runId, run, state, "no_start_node", "Workflow has no executable start node.");
      return;
    }

    while (currentNode && !state.completed) {
      const beforeNode = await this.runs.findById(runId, userId);
      if (!beforeNode || shouldExitProcessing(beforeNode.status)) return beforeNode;
      if (currentNode.type === "critic" || currentNode.key === "claude_critic") {
        await this.emit(userId, runId, "workflow.loop.started", { projectId: beforeNode.projectId, data: { iteration: state.iteration } });
      }

      let execution;
      try {
        execution = await this.executeNode(userId, runId, { ...beforeNode, iteration: state.iteration } as WorkflowRunDoc, dsl, currentNode.key, requirement, state.previousOutputs);
      } catch {
        return;
      }

      const afterExecution = await this.runs.findById(runId, userId);
      if (!afterExecution || shouldExitProcessing(afterExecution.status)) return afterExecution;

      if (currentNode.type === "critic" || currentNode.key === "claude_critic") {
        const stopped = await this.handleCriticNode(userId, runId, afterExecution, currentNode, execution, requirement, state);
        if (stopped) return;
      } else if (currentNode.type === "resolver" || currentNode.key === "issue_resolver") {
        await this.handleResolverNode(userId, runId, afterExecution, currentNode, execution, state);
      } else if (currentNode.type === "final_output") {
        await this.createFinalArtifact(userId, runId, afterExecution, execution);
        state.finalArtifactCreated = true;
      } else if (currentNode.type === "codex_prompt_generator") {
        await this.createCodexArtifact(userId, runId, afterExecution, execution);
      }

      const afterNode = await this.runs.findById(runId, userId);
      if (!afterNode || shouldExitProcessing(afterNode.status)) return afterNode;

      const nextEdge = selectNextEdge(dsl, currentNode.key, state);
      if (!nextEdge) {
        if (state.finalArtifactCreated || currentNode.type === "codex_prompt_generator") {
          await this.completeRun(userId, runId, afterNode, state);
          return;
        }
        await this.requestHumanReview(userId, runId, afterNode, state, "no_valid_next_edge", `No valid next edge from ${currentNode.key}.`);
        return;
      }

      if (shouldRequestHumanReviewForMaxIteration(currentNode, nextEdge, state)) {
        await this.requestHumanReview(userId, runId, afterNode, state, "max_iterations", "Max iterations reached with unresolved issues.");
        return;
      }

      await this.edge(userId, runId, afterNode.projectId, nextEdge.key, nextEdge.from, nextEdge.to);
      if ((currentNode.type === "resolver" || currentNode.key === "issue_resolver") && nextEdge.condition?.type === "iteration_remaining") {
        state.iteration += 1;
      }
      currentNode = getNode(dsl, nextEdge.to);
      if (!currentNode) {
        await this.requestHumanReview(userId, runId, afterNode, state, "missing_next_node", `Next node ${nextEdge.to} is missing.`);
        return;
      }
    }
  }

  private async handleCriticNode(userId: ObjectId, runId: ObjectId, run: WorkflowRunDoc, node: WorkflowDslNode, execution: any, requirement: any, state: WorkflowTraversalState) {
    const parsed = this.parser.parse<any>(execution.output ?? "{}");
    const criticOutput = parsed.ok ? parsed.value : { verdict: "needs_revision", issues: [{ title: "Structured parse failed", severity: "HIGH", affectedArea: "critic", recommendation: "Retry critic output" }], requirementDriftDetected: false };
    const issues = criticOutput.issues ?? [];
    state.lastCriticOutput = criticOutput;
    state.lastCriticIssues = issues;
    state.openBlockingIssues = issues.filter((issue: { severity?: string }) => ["BLOCKER", "HIGH"].includes(issue.severity ?? ""));
    await this.runs.updateById(runId, userId, { claudeVerdict: criticOutput.summary ?? criticOutput.verdict, iteration: state.iteration } as any);
    const drift = this.drift.check({ ...requirement, output: execution.output ?? "" });
    if (criticOutput.requirementDriftDetected || drift.driftDetected) {
      await this.emit(userId, runId, "workflow.drift_detected", { projectId: run.projectId, data: drift });
      const approval = await this.approvals.create({ userId, workspaceId: run.workspaceId, projectId: run.projectId, workflowRunId: runId, type: "requirement_drift_override", status: "pending", title: "Requirement drift detected", description: drift.reason, payload: drift, requestedBy: node.key, createdAt: new Date() } as any);
      await this.emit(userId, runId, "approval.required", { projectId: run.projectId, data: { approvalRequestId: approval!._id!.toHexString(), type: "requirement_drift_override" } });
      await this.runs.updateStatus(runId, userId, "needs_human_review", { stopReason: "requirement_drift" });
      state.completed = true;
      return true;
    }
    state.openIssueDocs = [];
    const existingIssues = await this.issues.collection().find({ userId, workflowRunId: runId, iteration: state.iteration, sourceAgent: node.key } as any).toArray();
    if (existingIssues.length > 0) {
      state.openIssueDocs = existingIssues.filter((issue: any) => issue.status === "open");
    } else {
      for (const issue of issues) {
        const saved = await this.issues.create({ userId, workflowRunId: runId, iteration: state.iteration, title: issue.title, severity: issue.severity, affectedArea: issue.affectedArea, recommendation: issue.recommendation, status: "open", sourceAgent: node.key, createdAt: new Date() } as any);
        state.openIssueDocs.push(saved);
        await this.emit(userId, runId, "critique.issue.created", { projectId: run.projectId, nodeKey: node.key, data: issue });
      }
    }
    if (state.openIssueDocs.length) await this.emit(userId, runId, "critique.issues_found", { projectId: run.projectId, data: { count: state.openIssueDocs.length } });
    return false;
  }

  private async handleResolverNode(userId: ObjectId, runId: ObjectId, run: WorkflowRunDoc, node: WorkflowDslNode, execution: any, state: WorkflowTraversalState) {
    const existingPatch = await this.patches.collection().findOne({ userId, workflowRunId: runId, iteration: state.iteration, fixedByAgents: node.key } as any);
    if (existingPatch) {
      state.openIssueDocs = [];
      state.openBlockingIssues = [];
      return;
    }
    await this.issues.markFixed(runId, userId);
    await this.patches.create({ userId, workflowRunId: runId, iteration: state.iteration, issueIds: state.openIssueDocs.map((doc: any) => doc._id), patchSummary: execution.output ?? "", fixedByAgents: [node.key], verificationStatus: "pending", createdAt: new Date() } as any);
    await this.emit(userId, runId, "revision.patch.created", { projectId: run.projectId, nodeKey: node.key, data: { iteration: state.iteration } });
    await this.emit(userId, runId, "workflow.loop.completed", { projectId: run.projectId, data: { iteration: state.iteration } });
    state.openIssueDocs = [];
    state.openBlockingIssues = [];
  }

  private async createFinalArtifact(userId: ObjectId, runId: ObjectId, run: WorkflowRunDoc, execution: any) {
    const finalArtifact = this.parser.parse<any>(execution.output ?? "{}");
    const artifactData = finalArtifact.ok ? finalArtifact.value : { title: "Final Output", type: "markdown", content: execution.output ?? "", metadata: {} };
    const existing = await this.artifacts.collection().findOne({ userId, workspaceId: run.workspaceId, workflowRunId: runId, type: artifactData.type } as any);
    if (existing) return;
    const artifact = await this.artifacts.create({ userId, workspaceId: run.workspaceId, projectId: run.projectId, workflowRunId: runId, title: artifactData.title, type: artifactData.type, content: artifactData.content, metadata: artifactData.metadata, createdAt: new Date() } as any);
    const version = await this.versions.create({ userId, workspaceId: run.workspaceId, artifactId: artifact!._id!, workflowRunId: runId, version: 1, title: artifactData.title, content: artifactData.content, createdAt: new Date() } as any);
    await this.artifacts.updateById(artifact!._id!, userId, { currentVersionId: version!._id } as any);
    await this.emit(userId, runId, "artifact.created", { projectId: run.projectId, data: { artifactId: artifact!._id!.toHexString(), type: artifactData.type } });
    await this.emit(userId, runId, "artifact.version.created", { projectId: run.projectId, data: { artifactId: artifact!._id!.toHexString(), versionId: version!._id!.toHexString(), version: 1 } });
  }

  private async createCodexArtifact(userId: ObjectId, runId: ObjectId, run: WorkflowRunDoc, execution: any) {
    const bundle = this.parser.parse<any>(execution.output ?? "{}");
    const data = bundle.ok ? bundle.value : { title: "Codex Prompt Bundle", type: "codex_prompt_bundle", content: execution.output ?? "", metadata: {} };
    const existing = await this.artifacts.collection().findOne({ userId, workspaceId: run.workspaceId, workflowRunId: runId, type: "codex_prompt_bundle" } as any);
    if (existing) return;
    const codexArtifact = await this.artifacts.create({ userId, workspaceId: run.workspaceId, projectId: run.projectId, workflowRunId: runId, title: data.title, type: "codex_prompt_bundle", content: data.content, metadata: data.metadata, createdAt: new Date() } as any);
    const codexVersion = await this.versions.create({ userId, workspaceId: run.workspaceId, artifactId: codexArtifact!._id!, workflowRunId: runId, version: 1, title: data.title, content: data.content, sourceExecutionId: execution._id, createdAt: new Date() } as any);
    await this.artifacts.updateById(codexArtifact!._id!, userId, { currentVersionId: codexVersion!._id } as any);
    await this.emit(userId, runId, "artifact.created", { projectId: run.projectId, data: { artifactId: codexArtifact!._id!.toHexString(), type: "codex_prompt_bundle" } });
    await this.emit(userId, runId, "artifact.version.created", { projectId: run.projectId, data: { artifactId: codexArtifact!._id!.toHexString(), versionId: codexVersion!._id!.toHexString(), version: 1 } });
  }

  private async completeRun(userId: ObjectId, runId: ObjectId, run: WorkflowRunDoc, state: WorkflowTraversalState) {
    await this.runs.updateStatus(runId, userId, "completed", { completedAt: new Date(), stopReason: "critic_approved" });
    await this.emit(userId, runId, "run.completed", { projectId: run.projectId, data: { status: "completed", iteration: state.iteration } });
    state.completed = true;
  }

  private async requestHumanReview(userId: ObjectId, runId: ObjectId, run: WorkflowRunDoc, state: WorkflowTraversalState, stopReason: string, description: string) {
    const approval = await this.approvals.create({ userId, workspaceId: run.workspaceId, projectId: run.projectId, workflowRunId: runId, type: "final_output_approval", status: "pending", title: "Workflow needs human review", description, requestedBy: "workflow_orchestrator", createdAt: new Date() } as any);
    await this.emit(userId, runId, "approval.required", { projectId: run.projectId, data: { approvalRequestId: approval!._id!.toHexString(), type: "final_output_approval" } });
    await this.runs.updateStatus(runId, userId, "needs_human_review", { stopReason });
    await this.emit(userId, runId, "run.needs_human_review", { projectId: run.projectId, data: { iteration: state.iteration, stopReason } });
    state.completed = true;
  }

  private async executeNode(userId: ObjectId, runId: ObjectId, run: WorkflowRunDoc, dsl: WorkflowDsl, nodeKey: string, requirement: any, previousOutputs: unknown[]) {
    const node = dsl.nodes.find((item) => item.key === nodeKey)!;
    await this.runs.updateById(runId, userId, { currentNodeKey: nodeKey, iteration: run.iteration } as any);
    const idempotencyKey = `${runId.toHexString()}:${nodeKey}:${run.iteration}`;
    const existingExecution = await this.executions.collection().findOne({ userId, workflowRunId: runId, idempotencyKey, status: "completed" } as any);
    if (existingExecution) {
      previousOutputs.push({ nodeKey, output: existingExecution.output });
      return Object.assign(existingExecution, { __reused: true });
    }
    await this.emit(userId, runId, "node.status.changed", { projectId: run.projectId, nodeKey, data: { status: "running", iteration: run.iteration } });
    const memory = await this.memory.findByProject(userId, run.projectId);
    const fresh = await this.runs.findById(runId, userId);
    const budget = this.buildBudgetSnapshot(fresh ?? run);
    await this.emitBudgetSnapshot(userId, runId, run.projectId, budget);
    const context = this.contextBuilder.build({ requirement, run: { ...(fresh ?? run), iteration: run.iteration }, budget, previousOutputs, openIssues: await this.issues.listOpen(runId), projectMemory: memory?.bullets ?? [] });
    const prompt = this.promptBuilder.build(nodeKey, context);
    const started = new Date();
    await this.emit(userId, runId, "agent.execution.started", { projectId: run.projectId, nodeKey, data: { nodeType: node.type } });

    if (node.type !== "requirement_lock") {
      const estimatedInputTokens = await this.llm.estimateTokens(prompt);
      const estimatedOutputTokens = Math.min(node.budget?.maxTokens ?? 1200, 4000);
      const estimate = await this.pricing.calculateCost({
        providerType: (process.env.LLM_MOCK_MODE ?? "true") === "true" ? "mock" : node.providerPreference ?? "mock",
        modelName: node.modelPreference ?? this.mockModelForNode(nodeKey),
        usage: { inputTokens: estimatedInputTokens, outputTokens: estimatedOutputTokens, usageSource: "estimated" },
        requestedAt: started
      });
      const estimatedCostUsd = estimate.costSource === "unavailable"
        ? this.budget.calculateCost(estimatedInputTokens, estimatedOutputTokens)
        : estimate.costUsd;
      const budgetDecision = this.budget.assertCanSpend(budget, estimatedInputTokens + estimatedOutputTokens, estimatedCostUsd);
      if (!budgetDecision.allowed) {
        await this.runs.updateStatus(runId, userId, "failed", { stopReason: "budget_exceeded", errorMessage: budgetDecision.reason });
        await this.emit(userId, runId, "budget.exceeded", { projectId: run.projectId, nodeKey, data: { reason: budgetDecision.reason, estimatedInputTokens, estimatedOutputTokens, estimatedCostUsd } });
        await this.emit(userId, runId, "agent.execution.failed", { projectId: run.projectId, nodeKey, data: { reason: budgetDecision.reason } });
        await this.emit(userId, runId, "run.failed", { projectId: run.projectId, data: { status: "failed", stopReason: "budget_exceeded" } });
        throw new Error(budgetDecision.reason);
      }
    }

    const output = node.type === "requirement_lock"
      ? {
          content: JSON.stringify({ locked: true, lockedGoal: requirement.lockedGoal }),
          inputTokens: 0,
          outputTokens: 0,
          usageSource: "estimated" as const,
          costUsd: 0,
          costSource: "unavailable" as const,
          calculatedAt: new Date(),
          latencyMs: 5,
          providerType: "mock",
          modelName: "Requirement Lock"
        }
      : await this.llm.chat({ prompt, providerType: node.providerPreference ?? "mock", modelName: node.modelPreference, userId: userId.toHexString(), nodeKey, iteration: run.iteration, context });
    const parsed = this.parser.parse(output.content);
    const execution = await this.executions.create({
      userId,
      workflowRunId: runId,
      nodeKey,
      nodeType: node.type,
      status: parsed.ok ? "completed" : "structured_parse_failed",
      input: context,
      output: output.content,
      structuredOutput: parsed.ok ? parsed.value : undefined,
      inputTokens: output.inputTokens,
      outputTokens: output.outputTokens,
      cachedInputTokens: output.cachedInputTokens,
      cacheWriteInputTokens: output.cacheWriteInputTokens,
      reasoningTokens: output.reasoningTokens,
      costUsd: output.costUsd,
      pricingSnapshotId: output.pricingSnapshotId,
      usageSource: output.usageSource,
      costSource: output.costSource,
      calculatedAt: output.calculatedAt,
      latencyMs: output.latencyMs,
      errorMessage: parsed.ok ? undefined : "structured_parse_failed",
      attempt: 1,
      idempotencyKey,
      startedAt: started,
      completedAt: new Date(),
      createdAt: started
    } as any);
    previousOutputs.push({ nodeKey, output: output.content });
    if (node.type !== "requirement_lock") {
      await this.usage.record({
        userId,
        workspaceId: run.workspaceId,
        projectId: run.projectId,
        workflowRunId: runId,
        providerType: output.providerType,
        modelName: output.modelName,
        inputTokens: output.inputTokens,
        outputTokens: output.outputTokens,
        cachedInputTokens: output.cachedInputTokens,
        cacheWriteInputTokens: output.cacheWriteInputTokens,
        reasoningTokens: output.reasoningTokens,
        costUsd: output.costUsd,
        pricingSnapshotId: output.pricingSnapshotId,
        usageSource: output.usageSource,
        costSource: output.costSource,
        calculatedAt: output.calculatedAt,
        latencyMs: output.latencyMs,
        source: "workflow"
      });
    }
    const updatedRun = await this.runs.findById(runId, userId);
    if (updatedRun) {
      const updatedBudget = this.buildBudgetSnapshot(updatedRun);
      await this.runs.updateById(runId, userId, { budgetState: updatedBudget } as any);
      await this.emitBudgetSnapshot(userId, runId, run.projectId, updatedBudget);
    }
    if (node.type === "consensus" && parsed.ok && Array.isArray((parsed.value as any).decisions)) {
      for (const decision of (parsed.value as any).decisions) {
        const saved = await this.decisions.create({
          userId,
          workflowRunId: runId,
          decision: String(decision.decision ?? decision),
          reason: String(decision.reason ?? "Accepted by consensus builder"),
          proposedBy: nodeKey,
          status: "accepted",
          createdAt: new Date()
        } as any);
        await this.emit(userId, runId, "agent.decision.created", { projectId: run.projectId, nodeKey, data: { decisionId: saved!._id!.toHexString(), decision: saved!.decision } });
      }
    }
    await this.agentMessages.create({ userId, workflowRunId: runId, iteration: run.iteration, fromAgent: nodeKey, nodeKey, messageType: node.type === "critic" ? "critique" : "proposal", content: output.content, createdAt: new Date() } as any);
    await this.emit(userId, runId, "agent.message.created", { projectId: run.projectId, nodeKey, data: { content: output.content.slice(0, 1000) } });
    await this.emit(userId, runId, "agent.execution.completed", { projectId: run.projectId, nodeKey, data: { executionId: execution!._id!.toHexString(), inputTokens: output.inputTokens, outputTokens: output.outputTokens, costUsd: output.costUsd, usageSource: output.usageSource, costSource: output.costSource } });
    await this.emit(userId, runId, "node.status.changed", { projectId: run.projectId, nodeKey, data: { status: "completed", inputTokens: output.inputTokens, outputTokens: output.outputTokens, costUsd: output.costUsd, usageSource: output.usageSource, costSource: output.costSource } });
    return execution!;
  }

  private edge(userId: ObjectId, runId: ObjectId, projectId: ObjectId, edgeKey: string, from: string, to: string) {
    return this.emit(userId, runId, "edge.traversed", { projectId, edgeKey, data: { from, to } });
  }

  private async emit(userId: ObjectId, workflowRunId: ObjectId, eventType: WorkflowEventType, input: { projectId?: ObjectId; nodeKey?: string; edgeKey?: string; message?: string; data: Record<string, unknown> }) {
    const event = await this.events.create({ userId, workflowRunId, eventType, nodeKey: input.nodeKey ?? null, edgeKey: input.edgeKey ?? null, message: input.message, data: input.data, createdAt: new Date() } as any);
    this.bus.publish({ eventType, workflowRunId: workflowRunId.toHexString(), projectId: input.projectId?.toHexString(), nodeKey: input.nodeKey ?? null, edgeKey: input.edgeKey ?? null, timestamp: event!.createdAt.toISOString(), message: input.message, data: input.data });
  }

  private buildBudgetSnapshot(run: WorkflowRunDoc) {
    const current = run.budgetState as any;
    return this.budget.buildSnapshot(
      Number(current?.maxTokens ?? 100000),
      (run.totalInputTokens ?? 0) + (run.totalOutputTokens ?? 0),
      Number(current?.maxCostUsd ?? 5),
      run.totalCostUsd ?? 0
    );
  }

  private async emitBudgetSnapshot(userId: ObjectId, workflowRunId: ObjectId, projectId: ObjectId, budgetState: ReturnType<BudgetService["buildSnapshot"]>) {
    await this.emit(userId, workflowRunId, "budget.snapshot.updated", { projectId, data: budgetState as unknown as Record<string, unknown> });
    for (const warning of budgetState.warnings) {
      await this.emit(userId, workflowRunId, "budget.warning", { projectId, data: { warning, mode: budgetState.mode } });
    }
  }

  private mockModelForNode(nodeKey: string) {
    if (nodeKey.includes("claude")) return "Mock Claude Opus";
    if (nodeKey.includes("gemini")) return "Mock Gemini";
    if (nodeKey.includes("codex")) return "Mock GPT-5 Codex";
    return "Mock GPT-5";
  }
}
