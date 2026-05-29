import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { UsageEventsRepository } from "../../repositories/usage-events.repository";
import { ProjectsRepository } from "../../repositories/projects.repository";
import { WorkflowRunsRepository } from "../../repositories/workflow-runs.repository";
import { ChatsRepository } from "../../repositories/chats.repository";

@Injectable()
export class UsageService {
  constructor(
    private readonly usage: UsageEventsRepository,
    private readonly projects: ProjectsRepository,
    private readonly runs: WorkflowRunsRepository,
    private readonly chats: ChatsRepository
  ) {}

  async record(input: { userId: ObjectId; projectId?: ObjectId; workflowRunId?: ObjectId; chatId?: ObjectId; providerType: string; modelName: string; inputTokens: number; outputTokens: number; costUsd: number; latencyMs: number; source: string }) {
    const event = await this.usage.create({ ...input, totalTokens: input.inputTokens + input.outputTokens, createdAt: new Date() } as any);
    if (input.projectId) await this.projects.incrementUsage(input.projectId, input.userId, input.inputTokens, input.outputTokens, input.costUsd);
    if (input.workflowRunId) await this.runs.incrementUsage(input.workflowRunId, input.userId, input.inputTokens, input.outputTokens, input.costUsd);
    if (input.chatId) await this.chats.incrementUsage(input.chatId, input.userId, input.inputTokens, input.outputTokens, input.costUsd);
    return event;
  }

  async summary(userId: ObjectId) {
    const rows = await this.usage.collection().aggregate([
      { $match: { userId } },
      { $group: { _id: null, inputTokens: { $sum: "$inputTokens" }, outputTokens: { $sum: "$outputTokens" }, totalTokens: { $sum: "$totalTokens" }, costUsd: { $sum: "$costUsd" } } }
    ]).toArray();
    return rows[0] ?? { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0 };
  }

  byProvider(userId: ObjectId) { return this.groupBy(userId, "$providerType"); }
  byModel(userId: ObjectId) { return this.groupBy(userId, "$modelName"); }
  byProject(userId: ObjectId) { return this.groupBy(userId, "$projectId"); }

  daily(userId: ObjectId) {
    return this.usage.collection().aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          inputTokens: { $sum: "$inputTokens" },
          outputTokens: { $sum: "$outputTokens" },
          totalTokens: { $sum: "$totalTokens" },
          costUsd: { $sum: "$costUsd" }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", inputTokens: 1, outputTokens: 1, totalTokens: 1, costUsd: { $round: ["$costUsd", 6] } } }
    ]).toArray();
  }

  async budgetAlerts(userId: ObjectId) {
    const summary = await this.summary(userId);
    const monthlyBudgetUsd = 100;
    const pct = monthlyBudgetUsd ? Number(summary.costUsd ?? 0) / monthlyBudgetUsd : 0;
    const alerts = [];
    if (pct >= 0.95) alerts.push({ level: "critical", message: "95% monthly budget used", usedCostUsd: summary.costUsd, budgetUsd: monthlyBudgetUsd });
    else if (pct >= 0.8) alerts.push({ level: "warning", message: "80% monthly budget used", usedCostUsd: summary.costUsd, budgetUsd: monthlyBudgetUsd });
    else if (pct >= 0.5) alerts.push({ level: "info", message: "50% monthly budget used", usedCostUsd: summary.costUsd, budgetUsd: monthlyBudgetUsd });
    return alerts;
  }

  private groupBy(userId: ObjectId, field: string) {
    return this.usage.collection().aggregate([
      { $match: { userId } },
      { $group: { _id: field, tokens: { $sum: "$totalTokens" }, costUsd: { $sum: "$costUsd" } } },
      { $sort: { costUsd: -1 } }
    ]).toArray();
  }
}
