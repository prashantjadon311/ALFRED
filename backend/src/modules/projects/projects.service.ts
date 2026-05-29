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

  async list(userId: ObjectId, page = 1, limit = 20, status?: string) {
    const result = await this.projects.listByUser(userId, status ? ({ status } as any) : ({} as any), { skip: (page - 1) * limit, limit });
    return { items: serializeDocs(result.items), total: result.total };
  }

  async create(userId: ObjectId, input: { name: string; description?: string; type: "software" | "research" | "planning" | "mixed" }) {
    const project = await this.projects.create({
      userId,
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

  async get(userId: ObjectId, projectId: ObjectId) {
    const project = await this.projects.findById(projectId, userId);
    if (!project) throw new NotFoundException("Project not found");
    return serializeDoc(project);
  }

  async update(userId: ObjectId, projectId: ObjectId, patch: Record<string, unknown>) {
    await this.get(userId, projectId);
    return serializeDoc(await this.projects.updateById(projectId, userId, patch as any));
  }

  async delete(userId: ObjectId, projectId: ObjectId) {
    await this.get(userId, projectId);
    return { deleted: await this.projects.deleteById(projectId, userId) };
  }

  async overview(userId: ObjectId, projectId: ObjectId) {
    const [project, requirement, runs, artifacts, chats] = await Promise.all([
      this.projects.findById(projectId, userId),
      this.requirements.findCurrent(userId, projectId),
      this.runs.listByUser(userId, { projectId } as any, { limit: 5 }),
      this.artifacts.listByUser(userId, { projectId } as any, { limit: 5 }),
      this.chats.listByUser(userId, { projectId } as any, { limit: 5 })
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

  async timeline(userId: ObjectId, projectId: ObjectId) {
    const runIds = (await this.runs.collection().find({ userId, projectId }, { projection: { _id: 1 } }).toArray()).map((run) => run._id);
    const events = await this.events.collection().find({ userId, workflowRunId: { $in: runIds } }).sort({ createdAt: -1 }).limit(50).toArray();
    return serializeDocs(events);
  }

  async usageByProject(userId: ObjectId, projectId: ObjectId) {
    const rows = await this.usage.collection().aggregate([
      { $match: { userId, projectId } },
      { $group: { _id: "$source", inputTokens: { $sum: "$inputTokens" }, outputTokens: { $sum: "$outputTokens" }, costUsd: { $sum: "$costUsd" } } }
    ]).toArray();
    return rows;
  }

  async graphState(userId: ObjectId, projectId: ObjectId) {
    const run = await this.runs.collection().find({ userId, projectId }).sort({ createdAt: -1 }).limit(1).next();
    if (!run) return { run: null, events: [] };
    const events = await this.events.recent(userId, run._id, 200);
    return { run: serializeDoc(run), events: serializeDocs(events) };
  }
}
