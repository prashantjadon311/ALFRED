import { Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { ProjectsRepository } from "../../repositories/projects.repository";
import { WorkflowRunsRepository } from "../../repositories/workflow-runs.repository";
import { WorkflowEventsRepository } from "../../repositories/workflow-events.repository";
import { CritiqueIssuesRepository } from "../../repositories/critique-issues.repository";
import { ArtifactsRepository } from "../../repositories/artifacts.repository";
import { ChatsRepository } from "../../repositories/chats.repository";
import { UsageEventsRepository } from "../../repositories/usage-events.repository";
import { RequirementContractsRepository } from "../../repositories/requirement-contracts.repository";
import { serializeDoc, serializeDocs } from "../../common/utils/object-id";

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projects: ProjectsRepository,
    private readonly runs: WorkflowRunsRepository,
    private readonly events: WorkflowEventsRepository,
    private readonly issues: CritiqueIssuesRepository,
    private readonly artifacts: ArtifactsRepository,
    private readonly chats: ChatsRepository,
    private readonly usage: UsageEventsRepository,
    private readonly requirements: RequirementContractsRepository
  ) {}

  async list(userId: ObjectId, workspaceId: ObjectId, page = 1, limit = 20, status?: string) {
    const result = await this.projects.listByUserAndWorkspace(userId, workspaceId, status ? ({ status } as any) : ({} as any), { skip: (page - 1) * limit, limit });
    return { items: serializeDocs(result.items), total: result.total };
  }

  async create(userId: ObjectId, workspaceId: ObjectId, input: { name: string; description?: string; type: "software" | "research" | "planning" | "mixed" }) {
    const project = await this.projects.create({
      userId,
      workspaceId,
      name: input.name,
      description: input.description ?? "",
      type: input.type,
      status: "planning",
      progress: 5,
      tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { totalUsd: 0 },
      metadata: {},
      createdAt: new Date()
    } as any);
    return serializeDoc(project);
  }

  async get(userId: ObjectId, workspaceId: ObjectId, projectId: ObjectId) {
    const project = await this.projects.findByIdForWorkspace(projectId, userId, workspaceId);
    if (!project) throw new NotFoundException("Project not found");
    return serializeDoc(project);
  }

  async update(userId: ObjectId, workspaceId: ObjectId, projectId: ObjectId, patch: Record<string, unknown>) {
    await this.get(userId, workspaceId, projectId);
    return serializeDoc(await this.projects.updateByIdForWorkspace(projectId, userId, workspaceId, patch as any));
  }

  async delete(userId: ObjectId, workspaceId: ObjectId, projectId: ObjectId) {
    await this.get(userId, workspaceId, projectId);
    return { deleted: await this.projects.deleteByIdForWorkspace(projectId, userId, workspaceId) };
  }

  async overview(userId: ObjectId, workspaceId: ObjectId, projectId: ObjectId) {
    const [project, requirement, runs, artifacts, chats] = await Promise.all([
      this.projects.findByIdForWorkspace(projectId, userId, workspaceId),
      this.requirements.findCurrent(userId, projectId),
      this.runs.listByUserAndWorkspace(userId, workspaceId, { projectId } as any, { limit: 5 }),
      this.artifacts.listByUserAndWorkspace(userId, workspaceId, { projectId } as any, { limit: 5 }),
      this.chats.listByUserAndWorkspace(userId, workspaceId, { projectId } as any, { limit: 5 })
    ]);
    if (!project) throw new NotFoundException("Project not found");
    const workflowRunIds = runs.items.map((run) => run._id).filter(Boolean);
    const openIssueCount = workflowRunIds.length
      ? await this.issues.collection().countDocuments({ userId, workflowRunId: { $in: workflowRunIds }, status: "open" } as any)
      : 0;
    return {
      project: serializeDoc(project),
      requirementContract: serializeDoc(requirement),
      recentRuns: serializeDocs(runs.items),
      artifacts: serializeDocs(artifacts.items),
      linkedChats: serializeDocs(chats.items),
      openIssueCount
    };
  }

  async timeline(userId: ObjectId, workspaceId: ObjectId, projectId: ObjectId) {
    await this.get(userId, workspaceId, projectId);
    const runIds = (await this.runs.collection().find({ userId, workspaceId, projectId }, { projection: { _id: 1 } }).toArray()).map((run) => run._id);
    const events = await this.events.collection().find({ userId, workflowRunId: { $in: runIds } }).sort({ createdAt: -1 }).limit(50).toArray();
    return serializeDocs(events);
  }

  async usageByProject(userId: ObjectId, workspaceId: ObjectId, projectId: ObjectId) {
    await this.get(userId, workspaceId, projectId);
    const rows = await this.usage.collection().aggregate([
      { $match: { userId, workspaceId, projectId } },
      { $group: { _id: "$source", inputTokens: { $sum: "$inputTokens" }, outputTokens: { $sum: "$outputTokens" }, costUsd: { $sum: "$costUsd" } } }
    ]).toArray();
    return rows;
  }

  async graphState(userId: ObjectId, workspaceId: ObjectId, projectId: ObjectId) {
    await this.get(userId, workspaceId, projectId);
    const run = await this.runs.collection().find({ userId, workspaceId, projectId }).sort({ createdAt: -1 }).limit(1).next();
    if (!run) return { run: null, events: [] };
    const events = await this.events.recent(userId, run._id, 200);
    return { run: serializeDoc(run), events: serializeDocs(events) };
  }
}
