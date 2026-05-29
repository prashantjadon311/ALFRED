import { Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { WorkflowEventType, WorkflowEventPayload } from "../../contracts/workflow-event.types";
import { WorkflowRunsRepository } from "../../repositories/workflow-runs.repository";
import { WorkflowEventsRepository } from "../../repositories/workflow-events.repository";
import { CritiqueIssuesRepository } from "../../repositories/critique-issues.repository";
import { ArtifactsRepository } from "../../repositories/artifacts.repository";
import { RealtimeEventBus } from "../realtime/realtime-event-bus.service";

@Injectable()
export class WorkflowRunsService {
  constructor(
    private readonly runs: WorkflowRunsRepository,
    private readonly events: WorkflowEventsRepository,
    private readonly issues: CritiqueIssuesRepository,
    private readonly artifacts: ArtifactsRepository,
    private readonly bus: RealtimeEventBus
  ) {}

  async list(userId: ObjectId, page: number, limit: number, projectId?: string) {
    const filter: Record<string, unknown> = {};
    if (projectId) filter.projectId = new ObjectId(projectId);
    const result = await this.runs.listByUser(userId, filter as any, { skip: (page - 1) * limit, limit });
    return { items: this.runs.serializeMany(result.items), total: result.total };
  }

  async get(userId: ObjectId, id: ObjectId) {
    const run = await this.runs.findById(id, userId);
    if (!run) throw new NotFoundException("Workflow run not found");
    return this.runs.serialize(run);
  }

  async pause(userId: ObjectId, id: ObjectId) {
    const run = await this.runs.findById(id, userId);
    if (!run) throw new NotFoundException("Workflow run not found");
    await this.runs.updateStatus(id, userId, "paused");
    await this.emit(userId, id, "run.paused", run.projectId, { status: "paused" });
    return { status: "paused" };
  }

  async resume(userId: ObjectId, id: ObjectId) {
    const run = await this.runs.findById(id, userId);
    if (!run) throw new NotFoundException("Workflow run not found");
    await this.runs.updateStatus(id, userId, "running");
    await this.emit(userId, id, "run.resumed", run.projectId, { status: "running" });
    return { status: "resumed" };
  }

  async stop(userId: ObjectId, id: ObjectId) {
    const run = await this.runs.findById(id, userId);
    if (!run) throw new NotFoundException("Workflow run not found");
    await this.runs.updateStatus(id, userId, "failed", { stopReason: "user_stopped" });
    await this.emit(userId, id, "run.stopped", run.projectId, { status: "stopped" });
    return { status: "stopped" };
  }

  async getGraphState(userId: ObjectId, id: ObjectId) {
    const run = await this.runs.findById(id, userId);
    if (!run) throw new NotFoundException("Workflow run not found");
    const recentEvents = await this.events.collection().find({ workflowRunId: id }).sort({ createdAt: -1 }).limit(200).toArray();
    const nodeStatuses: Record<string, unknown> = {};
    for (const e of recentEvents.reverse()) {
      if (e.eventType === "node.status.changed" && e.nodeKey) {
        nodeStatuses[e.nodeKey] = (e.data as any).status;
      }
    }
    return {
      status: run.status,
      currentNodeKey: run.currentNodeKey,
      iteration: run.iteration,
      totalCostUsd: run.totalCostUsd,
      budgetState: run.budgetState,
      nodeStatuses,
      dsl: run.workflowDslSnapshot
    };
  }

  async getLogs(userId: ObjectId, id: ObjectId, limit: number) {
    await this.assertAccess(id, userId);
    const evts = await this.events.collection().find({ workflowRunId: id }).sort({ createdAt: 1 }).limit(limit).toArray();
    return this.events.serializeMany(evts);
  }

  async getIssues(userId: ObjectId, id: ObjectId) {
    await this.assertAccess(id, userId);
    return this.issues.serializeMany(await this.issues.listByRun(id, userId));
  }

  async getArtifacts(userId: ObjectId, id: ObjectId) {
    await this.assertAccess(id, userId);
    const docs = await this.artifacts.collection().find({ workflowRunId: id, userId }).toArray();
    return this.artifacts.serializeMany(docs);
  }

  streamEvents(runId: ObjectId) {
    return this.bus.stream(runId.toHexString());
  }

  async getRecentEvents(userId: ObjectId, runId: ObjectId, limit = 50) {
    const run = await this.assertAccess(runId, userId);
    const docs = await this.events.collection().find({ userId, workflowRunId: runId }).sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.reverse().map((event) => this.toPayload(event, run.projectId));
  }

  private async assertAccess(id: ObjectId, userId: ObjectId) {
    const run = await this.runs.findById(id, userId);
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
