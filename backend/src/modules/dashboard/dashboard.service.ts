import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { ProjectsRepository } from "../../repositories/projects.repository";
import { WorkflowRunsRepository } from "../../repositories/workflow-runs.repository";
import { ModelProvidersRepository } from "../../repositories/model-providers.repository";
import { UsageService } from "../usage/usage.service";

type DashboardSummary = {
  projectStats: { total: number; byStatus: Record<string, number> };
  workflowStats: { total: number; byStatus: Record<string, number> };
  usageSummary: unknown;
  providerHealth: unknown[];
};

@Injectable()
export class DashboardService {
  private readonly summaryCache = new Map<string, { expiresAt: number; value: DashboardSummary }>();

  constructor(
    private readonly projects: ProjectsRepository,
    private readonly runs: WorkflowRunsRepository,
    private readonly providers: ModelProvidersRepository,
    private readonly usage: UsageService
  ) {}

  async summary(userId: ObjectId, workspaceId: ObjectId) {
    const cacheKey = `${userId.toHexString()}:${workspaceId.toHexString()}`;
    const cached = this.summaryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    const [projectStats, workflowStats, usageSummary, providerHealth] = await Promise.all([
      this.getProjectStats(userId, workspaceId),
      this.getWorkflowStats(userId, workspaceId),
      this.usage.summary(userId, workspaceId),
      this.getProviderHealth(userId)
    ]);
    const value: DashboardSummary = { projectStats, workflowStats, usageSummary, providerHealth };
    this.summaryCache.set(cacheKey, { expiresAt: Date.now() + 10_000, value });
    return value;
  }

  private async getProjectStats(userId: ObjectId, workspaceId: ObjectId) {
    const rows = await this.projects.collection().aggregate<{ _id: string; count: number }>([
      { $match: { userId, workspaceId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).toArray();
    const byStatus = Object.fromEntries(rows.map((row) => [row._id ?? "unknown", row.count]));
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    return { total, byStatus };
  }

  private async getWorkflowStats(userId: ObjectId, workspaceId: ObjectId) {
    const rows = await this.runs.collection().aggregate<{ _id: string; count: number }>([
      { $match: { userId, workspaceId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).toArray();
    const byStatus = Object.fromEntries(rows.map((row) => [row._id ?? "unknown", row.count]));
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    return { total, byStatus };
  }

  private async getProviderHealth(userId: ObjectId) {
    const { items } = await this.providers.listByUser(userId, {} as any, { limit: 100, projection: { name: 1, providerType: 1, healthStatus: 1, enabled: 1 } });
    return items;
  }
}
