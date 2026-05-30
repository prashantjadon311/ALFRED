import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { ProjectsRepository } from "../../repositories/projects.repository";
import { WorkflowRunsRepository } from "../../repositories/workflow-runs.repository";
import { ModelProvidersRepository } from "../../repositories/model-providers.repository";
import { UsageService } from "../usage/usage.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly projects: ProjectsRepository,
    private readonly runs: WorkflowRunsRepository,
    private readonly providers: ModelProvidersRepository,
    private readonly usage: UsageService
  ) {}

  async summary(userId: ObjectId) {
    const [projectStats, workflowStats, usageSummary, providerHealth] = await Promise.all([
      this.getProjectStats(userId),
      this.getWorkflowStats(userId),
      this.usage.summary(userId),
      this.getProviderHealth(userId)
    ]);
    return { projectStats, workflowStats, usageSummary, providerHealth };
  }

  private async getProjectStats(userId: ObjectId) {
    const { items, total } = await this.projects.listByUser(userId, {} as any, { limit: 1000, projection: { status: 1 } });
    const byStatus: Record<string, number> = {};
    for (const p of items) byStatus[(p as any).status] = (byStatus[(p as any).status] ?? 0) + 1;
    return { total, byStatus };
  }

  private async getWorkflowStats(userId: ObjectId) {
    const { items, total } = await this.runs.listByUser(userId, {} as any, { limit: 1000, projection: { status: 1 } });
    const byStatus: Record<string, number> = {};
    for (const r of items) byStatus[(r as any).status] = (byStatus[(r as any).status] ?? 0) + 1;
    return { total, byStatus };
  }

  private async getProviderHealth(userId: ObjectId) {
    const { items } = await this.providers.listByUser(userId, {} as any, { limit: 100, projection: { name: 1, providerType: 1, healthStatus: 1, enabled: 1 } });
    return items;
  }
}
