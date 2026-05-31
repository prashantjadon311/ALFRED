import { Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { toObjectId } from "../../common/utils/object-id";
import { WorkspacesRepository } from "../../repositories/workspaces.repository";

@Injectable()
export class WorkspaceScopeService {
  constructor(private readonly workspaces: WorkspacesRepository) {}

  async resolve(userId: ObjectId, workspaceHeader?: string | string[] | null) {
    const requested = Array.isArray(workspaceHeader) ? workspaceHeader[0] : workspaceHeader;
    if (requested?.trim()) {
      const workspaceId = toObjectId(requested, "workspaceId");
      const workspace = await this.workspaces.collection().findOne({ _id: workspaceId, userId, archived: { $ne: true } } as any);
      if (!workspace) throw new NotFoundException("Workspace not found");
      return workspace._id!;
    }

    const active = await this.workspaces.collection().findOne({ userId, active: true, archived: { $ne: true } } as any);
    if (active?._id) return active._id;

    const existing = await this.workspaces.collection().find({ userId, archived: { $ne: true } } as any).sort({ updatedAt: -1 }).limit(1).next();
    if (existing?._id) {
      await this.workspaces.setActive(userId, existing._id);
      return existing._id;
    }

    const created = await this.workspaces.create({
      userId,
      name: "My Workspace",
      description: "",
      plan: "free",
      active: true,
      archived: false,
      defaultProvider: "mock",
      defaultModel: "Mock GPT-5",
      monthlyTokenLimit: 100000,
      monthlyCostLimit: 25,
      themePreference: "dark",
      createdAt: new Date()
    } as any);
    return created!._id!;
  }
}
