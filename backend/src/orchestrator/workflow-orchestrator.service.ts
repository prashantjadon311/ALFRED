import { Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { WorkflowEventType } from "../contracts/workflow-event.types";
import { WorkflowDsl } from "../contracts/workflow-dsl.types";
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
    if (!run || ["completed", "running"].includes(run.status)) return run;
    const dsl = run.workflowDslSnapshot;
    const requirement = run.requirementContractSnapshot as any;
    await this.runs.updateStatus(runId, userId, "running", { startedAt: new Date() });
    await this.emit(userId, runId, "run.started", { projectId: run.projectId, message: "Workflow started", data: { status: "running" } });
    await this.emit(userId, runId, "run.running", { projectId: run.projectId, data: { status: "running" } });

    const previousOutputs: unknown[] = [];
    await this.executeNode(userId, runId, run, dsl, "requirement_lock", requirement, previousOutputs);
    await this.edge(userId, runId, run.projectId, "e1", "requirement_lock", "chatgpt_designer");
    await this.executeNode(userId, runId, run, dsl, "chatgpt_designer", requirement, previousOutputs);
    await this.edge(userId, runId, run.projectId, "e2", "chatgpt_designer", "gemini_architect");
    await this.executeNode(userId, runId, run, dsl, "gemini_architect", requirement, previousOutputs);
    await this.edge(userId, runId, run.projectId, "e3", "gemini_architect", "consensus_builder");
    await this.executeNode(userId, runId, run, dsl, "consensus_builder", requirement, previousOutputs);
    await this.edge(userId, runId, run.projectId, "e4", "consensus_builder", "claude_critic");

    let iteration = 1;
    while (iteration <= run.maxIterations) {
      await this.emit(userId, runId, "workflow.loop.started", { projectId: run.projectId, data: { iteration } });
      const critic = await this.executeNode(userId, runId, { ...run, iteration } as WorkflowRunDoc, dsl, "claude_critic", requirement, previousOutputs);
      const parsed = this.parser.parse<any>(critic.output ?? "{}");
      const criticOutput = parsed.ok ? parsed.value : { verdict: "needs_revision", issues: [{ title: "Structured parse failed", severity: "HIGH", affectedArea: "critic", recommendation: "Retry critic output" }], requirementDriftDetected: false };
      await this.runs.updateById(runId, userId, { claudeVerdict: criticOutput.summary ?? criticOutput.verdict, iteration } as any);
      const drift = this.drift.check({ ...requirement, output: critic.output ?? "" });
      if (criticOutput.requirementDriftDetected || drift.driftDetected) {
        await this.emit(userId, runId, "workflow.drift_detected", { projectId: run.projectId, data: drift });
        const approval = await this.approvals.create({ userId, projectId: run.projectId, workflowRunId: runId, type: "requirement_drift_override", status: "pending", title: "Requirement drift detected", description: drift.reason, payload: drift, requestedBy: "claude_critic", createdAt: new Date() } as any);
        await this.emit(userId, runId, "approval.required", { projectId: run.projectId, data: { approvalRequestId: approval!._id!.toHexString(), type: "requirement_drift_override" } });
        await this.runs.updateStatus(runId, userId, "needs_human_review", { stopReason: "requirement_drift" });
        return;
      }
      const issueDocs = [];
      for (const issue of criticOutput.issues ?? []) {
        const saved = await this.issues.create({ userId, workflowRunId: runId, iteration, title: issue.title, severity: issue.severity, affectedArea: issue.affectedArea, recommendation: issue.recommendation, status: "open", sourceAgent: "claude_critic", createdAt: new Date() } as any);
        issueDocs.push(saved);
        await this.emit(userId, runId, "critique.issue.created", { projectId: run.projectId, nodeKey: "claude_critic", data: issue });
      }
      if (issueDocs.length) await this.emit(userId, runId, "critique.issues_found", { projectId: run.projectId, data: { count: issueDocs.length } });
      if (!this.resolver.hasBlockingIssues(criticOutput.issues ?? [])) {
        await this.edge(userId, runId, run.projectId, "e7", "claude_critic", "final_output");
        const final = await this.executeNode(userId, runId, { ...run, iteration } as WorkflowRunDoc, dsl, "final_output", requirement, previousOutputs);
        const finalArtifact = this.parser.parse<any>(final.output ?? "{}");
        const artifactData = finalArtifact.ok ? finalArtifact.value : { title: "Final Output", type: "markdown", content: final.output ?? "", metadata: {} };
        const artifact = await this.artifacts.create({ userId, workspaceId: run.workspaceId, projectId: run.projectId, workflowRunId: runId, title: artifactData.title, type: artifactData.type, content: artifactData.content, metadata: artifactData.metadata, createdAt: new Date() } as any);
        const version = await this.versions.create({ userId, workspaceId: run.workspaceId, artifactId: artifact!._id!, workflowRunId: runId, version: 1, title: artifactData.title, content: artifactData.content, createdAt: new Date() } as any);
        await this.artifacts.updateById(artifact!._id!, userId, { currentVersionId: version!._id } as any);
        await this.emit(userId, runId, "artifact.created", { projectId: run.projectId, data: { artifactId: artifact!._id!.toHexString(), type: artifactData.type } });
        await this.emit(userId, runId, "artifact.version.created", { projectId: run.projectId, data: { artifactId: artifact!._id!.toHexString(), versionId: version!._id!.toHexString(), version: 1 } });
        if (["software", "mixed"].includes(requirement.taskType)) {
          await this.edge(userId, runId, run.projectId, "e8", "final_output", "codex_prompt_generator");
          const codex = await this.executeNode(userId, runId, { ...run, iteration } as WorkflowRunDoc, dsl, "codex_prompt_generator", requirement, previousOutputs);
          const bundle = this.parser.parse<any>(codex.output ?? "{}");
          const data = bundle.ok ? bundle.value : { title: "Codex Prompt Bundle", type: "codex_prompt_bundle", content: codex.output ?? "", metadata: {} };
          const codexArtifact = await this.artifacts.create({ userId, workspaceId: run.workspaceId, projectId: run.projectId, workflowRunId: runId, title: data.title, type: "codex_prompt_bundle", content: data.content, metadata: data.metadata, createdAt: new Date() } as any);
          const codexVersion = await this.versions.create({ userId, workspaceId: run.workspaceId, artifactId: codexArtifact!._id!, workflowRunId: runId, version: 1, title: data.title, content: data.content, sourceExecutionId: codex._id, createdAt: new Date() } as any);
          await this.artifacts.updateById(codexArtifact!._id!, userId, { currentVersionId: codexVersion!._id } as any);
          await this.emit(userId, runId, "artifact.created", { projectId: run.projectId, data: { artifactId: codexArtifact!._id!.toHexString(), type: "codex_prompt_bundle" } });
          await this.emit(userId, runId, "artifact.version.created", { projectId: run.projectId, data: { artifactId: codexArtifact!._id!.toHexString(), versionId: codexVersion!._id!.toHexString(), version: 1 } });
        }
        await this.runs.updateStatus(runId, userId, "completed", { completedAt: new Date(), stopReason: "critic_approved" });
        await this.emit(userId, runId, "run.completed", { projectId: run.projectId, data: { status: "completed" } });
        return;
      }
      if (iteration >= run.maxIterations) break;
      await this.edge(userId, runId, run.projectId, "e5", "claude_critic", "issue_resolver");
      const resolver = await this.executeNode(userId, runId, { ...run, iteration } as WorkflowRunDoc, dsl, "issue_resolver", requirement, previousOutputs);
      await this.issues.markFixed(runId, userId);
      await this.patches.create({ userId, workflowRunId: runId, iteration, issueIds: issueDocs.map((doc: any) => doc._id), patchSummary: resolver.output ?? "", fixedByAgents: ["issue_resolver"], verificationStatus: "pending", createdAt: new Date() } as any);
      await this.emit(userId, runId, "revision.patch.created", { projectId: run.projectId, nodeKey: "issue_resolver", data: { iteration } });
      await this.emit(userId, runId, "workflow.loop.completed", { projectId: run.projectId, data: { iteration } });
      const nextIteration = iteration + 1;
      await this.edge(userId, runId, run.projectId, "e6", "issue_resolver", "chatgpt_designer");
      await this.executeNode(userId, runId, { ...run, iteration: nextIteration } as WorkflowRunDoc, dsl, "chatgpt_designer", requirement, previousOutputs);
      await this.edge(userId, runId, run.projectId, "e2", "chatgpt_designer", "gemini_architect");
      await this.executeNode(userId, runId, { ...run, iteration: nextIteration } as WorkflowRunDoc, dsl, "gemini_architect", requirement, previousOutputs);
      await this.edge(userId, runId, run.projectId, "e3", "gemini_architect", "consensus_builder");
      await this.executeNode(userId, runId, { ...run, iteration: nextIteration } as WorkflowRunDoc, dsl, "consensus_builder", requirement, previousOutputs);
      await this.edge(userId, runId, run.projectId, "e4", "consensus_builder", "claude_critic");
      iteration = nextIteration;
    }
    const approval = await this.approvals.create({ userId, projectId: run.projectId, workflowRunId: runId, type: "final_output_approval", status: "pending", title: "Workflow needs human review", description: "Max iterations reached with unresolved issues.", requestedBy: "workflow_orchestrator", createdAt: new Date() } as any);
    await this.emit(userId, runId, "approval.required", { projectId: run.projectId, data: { approvalRequestId: approval!._id!.toHexString(), type: "final_output_approval" } });
    await this.runs.updateStatus(runId, userId, "needs_human_review", { stopReason: "max_iterations" });
    await this.emit(userId, runId, "run.needs_human_review", { projectId: run.projectId, data: { iteration } });
  }

  private async executeNode(userId: ObjectId, runId: ObjectId, run: WorkflowRunDoc, dsl: WorkflowDsl, nodeKey: string, requirement: any, previousOutputs: unknown[]) {
    const node = dsl.nodes.find((item) => item.key === nodeKey)!;
    await this.runs.updateById(runId, userId, { currentNodeKey: nodeKey, iteration: run.iteration } as any);
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
      const estimatedCostUsd = this.budget.calculateCost(estimatedInputTokens, estimatedOutputTokens);
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
      ? { content: JSON.stringify({ locked: true, lockedGoal: requirement.lockedGoal }), inputTokens: 10, outputTokens: 12, costUsd: 0, latencyMs: 5, providerType: "mock", modelName: "Requirement Lock" }
      : await this.llm.chat({ prompt, providerType: node.providerPreference ?? "mock", modelName: node.modelPreference, nodeKey, iteration: run.iteration, context });
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
      costUsd: output.costUsd,
      latencyMs: output.latencyMs,
      errorMessage: parsed.ok ? undefined : "structured_parse_failed",
      attempt: 1,
      idempotencyKey: `${runId.toHexString()}:${nodeKey}:${run.iteration}`,
      startedAt: started,
      completedAt: new Date(),
      createdAt: started
    } as any);
    previousOutputs.push({ nodeKey, output: output.content });
    await this.usage.record({ userId, workspaceId: run.workspaceId, projectId: run.projectId, workflowRunId: runId, providerType: output.providerType, modelName: output.modelName, inputTokens: output.inputTokens, outputTokens: output.outputTokens, costUsd: output.costUsd, latencyMs: output.latencyMs, source: "workflow" });
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
    await this.emit(userId, runId, "agent.execution.completed", { projectId: run.projectId, nodeKey, data: { executionId: execution!._id!.toHexString(), inputTokens: output.inputTokens, outputTokens: output.outputTokens, costUsd: output.costUsd } });
    await this.emit(userId, runId, "node.status.changed", { projectId: run.projectId, nodeKey, data: { status: "completed", inputTokens: output.inputTokens, outputTokens: output.outputTokens, costUsd: output.costUsd } });
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
}
