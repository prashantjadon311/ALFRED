import { Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { RequirementContractsRepository } from "../../repositories/requirement-contracts.repository";
import { ProjectsRepository } from "../../repositories/projects.repository";
import { AuditLogsRepository } from "../../repositories/audit-logs.repository";
import { RequirementDriftService } from "../../orchestrator/requirement-drift.service";
import { serializeDoc } from "../../common/utils/object-id";

@Injectable()
export class RequirementContractsService {
  constructor(
    private readonly contracts: RequirementContractsRepository,
    private readonly projects: ProjectsRepository,
    private readonly audit: AuditLogsRepository,
    private readonly drift: RequirementDriftService
  ) {}

  async create(userId: ObjectId, projectId: ObjectId, input: any) {
    const project = await this.projects.findById(projectId, userId);
    if (!project) throw new NotFoundException("Project not found");
    const version = (await this.contracts.collection().countDocuments({ userId, projectId })) + 1;
    const contract = await this.contracts.create({
      userId,
      projectId,
      originalRequirement: input.originalRequirement,
      lockedGoal: input.lockedGoal ?? input.originalRequirement,
      taskType: input.taskType ?? project.type,
      nonNegotiables: input.nonNegotiables ?? [],
      successCriteria: input.successCriteria ?? [],
      outOfScope: input.outOfScope ?? [],
      allowedChanges: input.allowedChanges ?? ["Implementation details", "Architecture refinements", "Prompt compression"],
      forbiddenChanges: input.forbiddenChanges ?? ["Changing original motive", "Switching product category", "Exposing secrets"],
      driftStatus: "stable",
      driftScore: 0,
      locked: input.locked ?? true,
      lockedAt: input.locked === false ? undefined : new Date(),
      version,
      createdAt: new Date()
    } as any);
    await this.projects.updateById(projectId, userId, { activeRequirementContractId: contract!._id } as any);
    await this.audit.audit({ userId, entityType: "requirement_contract", entityId: contract!._id!.toHexString(), action: "requirement_contract.created", metadata: { projectId } });
    return serializeDoc(contract);
  }

  async current(userId: ObjectId, projectId: ObjectId) {
    const contract = await this.contracts.findCurrent(userId, projectId);
    if (!contract) throw new NotFoundException("Requirement contract not found");
    return serializeDoc(contract);
  }

  async update(userId: ObjectId, id: ObjectId, patch: any) {
    const updated = await this.contracts.patchContract(id, userId, patch);
    if (!updated) throw new NotFoundException("Requirement contract not found");
    return serializeDoc(updated);
  }

  async checkDrift(userId: ObjectId, id: ObjectId, output: string) {
    const contract = await this.contracts.findById(id, userId);
    if (!contract) throw new NotFoundException("Requirement contract not found");
    const result = this.drift.check({ ...contract, output });
    await this.contracts.updateById(id, userId, {
      driftStatus: result.driftDetected ? "drift_detected" : "stable",
      driftScore: result.driftScore
    } as any);
    return result;
  }
}
