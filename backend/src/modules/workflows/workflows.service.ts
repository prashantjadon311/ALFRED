import { Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { WorkflowsRepository } from "../../repositories/workflows.repository";
import { WorkflowDslValidatorService } from "../../orchestrator/workflow-dsl.validator";
import { WorkflowOrchestratorService } from "../../orchestrator/workflow-orchestrator.service";
import { defaultWorkflowDsl } from "../../orchestrator/default-workflow.dsl";
import { WorkflowQueueService } from "../../queues/workflow.queue";

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly repo: WorkflowsRepository,
    private readonly validator: WorkflowDslValidatorService,
    private readonly orchestrator: WorkflowOrchestratorService,
    private readonly queue: WorkflowQueueService
  ) {}

  async list(userId: ObjectId, page: number, limit: number, projectId?: string) {
    const filter: Record<string, unknown> = {};
    if (projectId) filter.projectId = new ObjectId(projectId);
    const result = await this.repo.listByUser(userId, filter as any, { skip: (page - 1) * limit, limit });
    return { items: this.repo.serializeMany(result.items), total: result.total };
  }

  async create(userId: ObjectId, body: { name: string; description?: string; projectId?: string; workflowDsl?: unknown; maxIterations?: number; maxTokens?: number; maxCostUsd?: number }) {
    const dslInput = this.hasWorkflowDsl(body.workflowDsl) ? body.workflowDsl : defaultWorkflowDsl;
    const dsl = this.validator.validate(dslInput);
    const doc = await this.repo.create({ userId, projectId: body.projectId ? new ObjectId(body.projectId) : undefined, name: body.name, description: body.description, workflowDsl: dsl, maxIterations: body.maxIterations ?? 3, maxTokens: body.maxTokens ?? 100000, maxCostUsd: body.maxCostUsd ?? 5, status: "active", version: 1, createdAt: new Date() } as any);
    return this.repo.serialize(doc);
  }

  async get(userId: ObjectId, id: ObjectId) {
    const doc = await this.repo.findById(id, userId);
    if (!doc) throw new NotFoundException("Workflow not found");
    return this.repo.serialize(doc);
  }

  async update(userId: ObjectId, id: ObjectId, body: { name?: string; description?: string; workflowDsl?: unknown; maxIterations?: number; maxTokens?: number; maxCostUsd?: number }) {
    const patch: Record<string, unknown> = { ...body };
    if (body.workflowDsl) patch.workflowDsl = this.validator.validate(body.workflowDsl);
    const doc = await this.repo.updateById(id, userId, patch as any);
    if (!doc) throw new NotFoundException("Workflow not found");
    return this.repo.serialize(doc);
  }

  async delete(userId: ObjectId, id: ObjectId) {
    const ok = await this.repo.deleteById(id, userId);
    if (!ok) throw new NotFoundException("Workflow not found");
    return { deleted: true };
  }

  async validate(userId: ObjectId, id: ObjectId) {
    const doc = await this.repo.findById(id, userId);
    if (!doc) throw new NotFoundException("Workflow not found");
    const result = this.validator.validate(doc.workflowDsl);
    return { valid: true, dsl: result };
  }

  async run(userId: ObjectId, id: ObjectId, projectId: string) {
    const doc = await this.repo.findById(id, userId);
    if (!doc) throw new NotFoundException("Workflow not found");
    const run = await this.orchestrator.startRun(userId, id, new ObjectId(projectId));
    await this.queue.enqueue(run._id!.toHexString(), userId.toHexString());
    return this.repo.serialize(run as any);
  }

  private hasWorkflowDsl(value: unknown) {
    return typeof value === "object" && value !== null && Object.keys(value).length > 0;
  }
}
