import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { serializeDoc, serializeDocs } from "../../common/utils/object-id";
import { WorkspacesRepository } from "../../repositories/workspaces.repository";

type WorkspaceInput = {
  name: string;
  description?: string;
  plan?: string;
  active?: boolean;
  defaultProvider?: string;
  defaultModel?: string;
  monthlyTokenLimit?: number;
  monthlyCostLimit?: number;
  themePreference?: "dark" | "light" | "system";
};

@Injectable()
export class WorkspacesService {
  constructor(private readonly workspaces: WorkspacesRepository) {}

  async list(userId: ObjectId, page = 1, limit = 20, includeArchived = false) {
    const filter = includeArchived ? {} : ({ archived: { $ne: true } } as any);
    const result = await this.workspaces.listByUser(userId, filter, { skip: (page - 1) * limit, limit });
    return { items: serializeDocs(result.items), total: result.total };
  }

  async create(userId: ObjectId, input: WorkspaceInput) {
    const hasWorkspace = await this.workspaces.collection().countDocuments({ userId, archived: { $ne: true } } as any);
    const active = input.active ?? hasWorkspace === 0;
    if (active) {
      await this.workspaces.collection().updateMany({ userId } as any, { $set: { active: false, updatedAt: new Date() } } as any);
    }
    const doc = await this.workspaces.create({
      userId,
      name: input.name,
      description: input.description ?? "",
      plan: input.plan ?? "Pro",
      active,
      archived: false,
      defaultProvider: input.defaultProvider ?? "mock",
      defaultModel: input.defaultModel ?? "Mock GPT-5",
      monthlyTokenLimit: input.monthlyTokenLimit ?? 1000000,
      monthlyCostLimit: input.monthlyCostLimit ?? 250,
      themePreference: input.themePreference ?? "dark",
      createdAt: new Date()
    } as any);
    return serializeDoc(doc);
  }

  async get(userId: ObjectId, id: ObjectId) {
    const doc = await this.workspaces.findById(id, userId);
    if (!doc || doc.archived) throw new NotFoundException("Workspace not found");
    return serializeDoc(doc);
  }

  async update(userId: ObjectId, id: ObjectId, patch: Partial<WorkspaceInput & { archived: boolean }>) {
    await this.get(userId, id);
    if (patch.active) {
      await this.workspaces.collection().updateMany({ userId } as any, { $set: { active: false, updatedAt: new Date() } } as any);
    }
    const doc = await this.workspaces.updateById(id, userId, patch as any);
    return serializeDoc(doc);
  }

  async archive(userId: ObjectId, id: ObjectId) {
    const current = await this.get(userId, id);
    const wasActive = Boolean((current as any).active);
    const doc = await this.workspaces.updateById(id, userId, { active: false, archived: true } as any);
    if (wasActive) {
      const replacement = await this.workspaces.collection().find({ userId, archived: { $ne: true } } as any).sort({ updatedAt: -1 }).limit(1).next();
      if (replacement?._id) await this.workspaces.setActive(userId, replacement._id);
    }
    return { archived: true, workspace: serializeDoc(doc) };
  }

  async switchWorkspace(userId: ObjectId, id: ObjectId) {
    try {
      const existing = await this.workspaces.findById(id, userId);
      if (!existing || existing.archived) throw new NotFoundException("Workspace not found");
      await this.workspaces.collection().updateMany({ userId, _id: { $ne: id } } as any, { $set: { active: false, updatedAt: new Date() } } as any);
      const doc = await this.workspaces.updateById(id, userId, { active: true } as any);
      if (!doc) throw new NotFoundException("Workspace not found");
      return serializeDoc(doc);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error instanceof Error ? error.message : "Could not switch workspace");
    }
  }
}
