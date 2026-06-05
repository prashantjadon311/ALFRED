import { Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { WorkflowsRepository } from "../../repositories/workflows.repository";
import { ProjectsRepository } from "../../repositories/projects.repository";
import { WorkflowDslValidatorService } from "../../orchestrator/workflow-dsl.validator";
import { WorkflowOrchestratorService } from "../../orchestrator/workflow-orchestrator.service";
import { defaultWorkflowDsl } from "../../orchestrator/default-workflow.dsl";
import { WorkflowQueueService } from "../../queues/workflow.queue";

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly repo: WorkflowsRepository,
    private readonly projects: ProjectsRepository,
    private readonly validator: WorkflowDslValidatorService,
    private readonly orchestrator: WorkflowOrchestratorService,
    private readonly queue: WorkflowQueueService
  ) {}

  async list(userId: ObjectId, workspaceId: ObjectId, page: number, limit: number, projectId?: string) {
    const filter: Record<string, unknown> = {};
    if (projectId) {
      const pid = new ObjectId(projectId);
      await this.assertProject(userId, workspaceId, pid);
      filter.projectId = pid;
    }
    const result = await this.repo.listByUserAndWorkspace(userId, workspaceId, filter as any, { skip: (page - 1) * limit, limit });
    return { items: this.repo.serializeMany(result.items), total: result.total };
  }

  async create(userId: ObjectId, workspaceId: ObjectId, body: { name: string; description?: string; projectId?: string; workflowDsl?: unknown; maxIterations?: number; maxTokens?: number; maxCostUsd?: number }) {
    const projectId = body.projectId ? new ObjectId(body.projectId) : undefined;
    if (projectId) await this.assertProject(userId, workspaceId, projectId);
    const dslInput = this.hasWorkflowDsl(body.workflowDsl) ? body.workflowDsl : defaultWorkflowDsl;
    const dsl = this.validator.validate(dslInput);
    const doc = await this.repo.create({ userId, workspaceId, projectId, name: body.name, description: body.description, workflowDsl: dsl, maxIterations: body.maxIterations ?? 3, maxTokens: body.maxTokens ?? 100000, maxCostUsd: body.maxCostUsd ?? 5, status: "active", version: 1, createdAt: new Date() } as any);
    return this.repo.serialize(doc);
  }

  async get(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    const doc = await this.repo.findByIdForWorkspace(id, userId, workspaceId);
    if (!doc) throw new NotFoundException("Workflow not found");
    return this.repo.serialize(doc);
  }

  async update(userId: ObjectId, workspaceId: ObjectId, id: ObjectId, body: { name?: string; description?: string; workflowDsl?: unknown; maxIterations?: number; maxTokens?: number; maxCostUsd?: number }) {
    const patch: Record<string, unknown> = { ...body };
    if (body.workflowDsl) patch.workflowDsl = this.validator.validate(body.workflowDsl);
    const doc = await this.repo.updateByIdForWorkspace(id, userId, workspaceId, patch as any);
    if (!doc) throw new NotFoundException("Workflow not found");
    return this.repo.serialize(doc);
  }

  async delete(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    const ok = await this.repo.deleteByIdForWorkspace(id, userId, workspaceId);
    if (!ok) throw new NotFoundException("Workflow not found");
    return { deleted: true };
  }

  async validate(userId: ObjectId, workspaceId: ObjectId, id: ObjectId, workflowDsl?: unknown) {
    const doc = await this.repo.findByIdForWorkspace(id, userId, workspaceId);
    if (!doc) throw new NotFoundException("Workflow not found");
    const result = this.validator.validate(this.hasWorkflowDsl(workflowDsl) ? workflowDsl : doc.workflowDsl);
    return { valid: true, dsl: result };
  }

  async run(userId: ObjectId, workspaceId: ObjectId, id: ObjectId, projectId: string) {
    const doc = await this.repo.findByIdForWorkspace(id, userId, workspaceId);
    if (!doc) throw new NotFoundException("Workflow not found");
    const projectObjectId = new ObjectId(projectId);
    await this.assertProject(userId, workspaceId, projectObjectId);
    const run = await this.orchestrator.startRun(userId, workspaceId, id, projectObjectId);
    await this.queue.enqueue(run._id!.toHexString(), userId.toHexString());
    return this.repo.serialize(run as any);
  }

  private hasWorkflowDsl(value: unknown) {
    return typeof value === "object" && value !== null && Object.keys(value).length > 0;
  }

  private async assertProject(userId: ObjectId, workspaceId: ObjectId, projectId: ObjectId) {
    const project = await this.projects.findByIdForWorkspace(projectId, userId, workspaceId);
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }
}
