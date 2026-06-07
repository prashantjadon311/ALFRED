import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { WorkflowEventType, WorkflowEventPayload } from "../../contracts/workflow-event.types";
import { WorkflowRunsRepository } from "../../repositories/workflow-runs.repository";
import { WorkflowEventsRepository } from "../../repositories/workflow-events.repository";
import { CritiqueIssuesRepository } from "../../repositories/critique-issues.repository";
import { ArtifactsRepository } from "../../repositories/artifacts.repository";
import { WorkflowQueueService } from "../../queues/workflow.queue";
import { RealtimeEventBus } from "../realtime/realtime-event-bus.service";

@Injectable()
export class WorkflowRunsService {
  constructor(
    private readonly runs: WorkflowRunsRepository,
    private readonly events: WorkflowEventsRepository,
    private readonly issues: CritiqueIssuesRepository,
    private readonly artifacts: ArtifactsRepository,
    private readonly queue: WorkflowQueueService,
    private readonly bus: RealtimeEventBus
  ) {}

  async list(userId: ObjectId, workspaceId: ObjectId, page: number, limit: number, projectId?: string) {
    const filter: Record<string, unknown> = {};
    if (projectId) filter.projectId = new ObjectId(projectId);
    const result = await this.runs.listByUserAndWorkspace(userId, workspaceId, filter as any, { skip: (page - 1) * limit, limit });
    return { items: this.runs.serializeMany(result.items), total: result.total };
  }

  async get(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    const run = await this.runs.findByIdForWorkspace(id, userId, workspaceId);
    if (!run) throw new NotFoundException("Workflow run not found");
    return this.runs.serialize(run);
  }

  async pause(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    const run = await this.runs.findByIdForWorkspace(id, userId, workspaceId);
    if (!run) throw new NotFoundException("Workflow run not found");
    if (!["queued", "running"].includes(run.status)) return this.runs.serialize(run);
    const updated = await this.runs.updateStatus(id, userId, "paused");
    await this.emit(userId, id, "run.paused", run.projectId, { status: "paused" });
    return this.runs.serialize(updated);
  }

  async resume(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    const run = await this.runs.findByIdForWorkspace(id, userId, workspaceId);
    if (!run) throw new NotFoundException("Workflow run not found");
    if (["queued", "running"].includes(run.status)) return this.runs.serialize(run);
    if (["completed", "failed", "stopped", "needs_human_review"].includes(run.status)) {
      throw new BadRequestException("Workflow run cannot be resumed");
    }
    const updated = await this.runs.updateStatus(id, userId, "queued", { stopReason: undefined, errorMessage: undefined } as any);
    await this.queue.enqueueResume(id.toHexString(), userId.toHexString());
    await this.emit(userId, id, "run.resumed", run.projectId, { status: "queued" });
    return this.runs.serialize(updated);
  }

  async stop(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    const run = await this.runs.findByIdForWorkspace(id, userId, workspaceId);
    if (!run) throw new NotFoundException("Workflow run not found");
    if (!["queued", "running", "paused"].includes(run.status)) return this.runs.serialize(run);
    const updated = await this.runs.updateStatus(id, userId, "stopped", { stopReason: "user_stopped" });
    await this.emit(userId, id, "run.stopped", run.projectId, { status: "stopped" });
    return this.runs.serialize(updated);
  }

  async getGraphState(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    const run = await this.runs.findByIdForWorkspace(id, userId, workspaceId);
    if (!run) throw new NotFoundException("Workflow run not found");
    return this.buildGraphState(run, userId, id);
  }

  async getDetail(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    const run = await this.assertAccess(id, userId, workspaceId);
    const [graphState, logs, issues, artifacts] = await Promise.all([
      this.buildGraphState(run, userId, id),
      this.events.collection().find({ userId, workflowRunId: id }).sort({ createdAt: 1 }).limit(200).toArray(),
      this.issues.listByRun(id, userId),
      this.artifacts.collection().find({ workflowRunId: id, userId, workspaceId }).toArray()
    ]);
    return {
      run: this.runs.serialize(run),
      graphState,
      logs: this.events.serializeMany(logs),
      issues: this.issues.serializeMany(issues),
      artifacts: this.artifacts.serializeMany(artifacts)
    };
  }

  private async buildGraphState(run: any, userId: ObjectId, id: ObjectId) {
    const recentEvents = await this.events.collection().find({ userId, workflowRunId: id }).sort({ createdAt: -1 }).limit(200).toArray();
    const nodeStatuses: Record<string, unknown> = {};
    for (const e of recentEvents.reverse()) {
      if (e.eventType === "node.status.changed" && e.nodeKey) {
        nodeStatuses[e.nodeKey] = (e.data as any).status;
      }
    }
    const dsl = run.workflowDslSnapshot;
    const nodes = dsl.nodes.map((node: any) => ({
      ...node,
      status: nodeStatuses[node.key] ?? (node.key === run.currentNodeKey ? "running" : "pending")
    }));
    return {
      run: this.runs.serialize(run),
      status: run.status,
      currentNodeKey: run.currentNodeKey,
      iteration: run.iteration,
      totalInputTokens: run.totalInputTokens,
      totalOutputTokens: run.totalOutputTokens,
      totalTokens: (run.totalInputTokens ?? 0) + (run.totalOutputTokens ?? 0),
      totalCostUsd: run.totalCostUsd,
      budgetState: run.budgetState,
      nodes,
      edges: dsl.edges,
      nodeStatuses,
      dsl
    };
  }

  async getLogs(userId: ObjectId, workspaceId: ObjectId, id: ObjectId, limit: number) {
    await this.assertAccess(id, userId, workspaceId);
    const evts = await this.events.collection().find({ userId, workflowRunId: id }).sort({ createdAt: 1 }).limit(limit).toArray();
    return this.events.serializeMany(evts);
  }

  async getIssues(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    await this.assertAccess(id, userId, workspaceId);
    return this.issues.serializeMany(await this.issues.listByRun(id, userId));
  }

  async getArtifacts(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    await this.assertAccess(id, userId, workspaceId);
    const docs = await this.artifacts.collection().find({ workflowRunId: id, userId, workspaceId }).toArray();
    return this.artifacts.serializeMany(docs);
  }

  streamEvents(runId: ObjectId) {
    return this.bus.stream(runId.toHexString());
  }

  async getRecentEvents(userId: ObjectId, workspaceId: ObjectId, runId: ObjectId, limit = 50) {
    const run = await this.assertAccess(runId, userId, workspaceId);
    const docs = await this.events.collection().find({ userId, workflowRunId: runId }).sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.reverse().map((event) => this.toPayload(event, run.projectId));
  }

  private async assertAccess(id: ObjectId, userId: ObjectId, workspaceId: ObjectId) {
    const run = await this.runs.findByIdForWorkspace(id, userId, workspaceId);
    if (!run) throw new NotFoundException("Workflow run not found");
    return run;
  }

  private async emit(userId: ObjectId, workflowRunId: ObjectId, eventType: WorkflowEventType, projectId: ObjectId, data: Record<string, unknown>) {
    const event = await this.events.create({
      userId,
      workflowRunId,
      eventType,
      nodeKey: null,
      edgeKey: null,
      data,
      createdAt: new Date()
    } as any);
    const payload = this.toPayload(event!, projectId);
    this.bus.publish(payload);
    return payload;
  }

  private toPayload(event: any, projectId?: ObjectId): WorkflowEventPayload {
    return {
      eventType: event.eventType,
      workflowRunId: event.workflowRunId.toHexString(),
      projectId: projectId?.toHexString(),
      nodeKey: event.nodeKey ?? null,
      edgeKey: event.edgeKey ?? null,
      timestamp: event.createdAt.toISOString(),
      message: event.message,
      data: event.data ?? {}
    };
  }
}
