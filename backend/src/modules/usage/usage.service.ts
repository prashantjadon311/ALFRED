import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { UsageEventsRepository } from "../../repositories/usage-events.repository";
import { ProjectsRepository } from "../../repositories/projects.repository";
import { WorkflowRunsRepository } from "../../repositories/workflow-runs.repository";
import { ChatsRepository } from "../../repositories/chats.repository";
import { ChatOutput } from "../../llm/interfaces/llm.types";

type UsageRecordInput = Pick<ChatOutput,
  "providerType" | "modelName" | "inputTokens" | "outputTokens" | "cachedInputTokens" | "reasoningTokens" |
  "costUsd" | "pricingSnapshotId" | "usageSource" | "costSource" | "calculatedAt" | "latencyMs"
> & {
  userId: ObjectId;
  workspaceId: ObjectId;
  projectId?: ObjectId;
  workflowRunId?: ObjectId;
  chatId?: ObjectId;
  source: string;
};

@Injectable()
export class UsageService {
  private readonly cache = new Map<string, { expiresAt: number; value: unknown }>();

  constructor(
    private readonly usage: UsageEventsRepository,
    private readonly projects: ProjectsRepository,
    private readonly runs: WorkflowRunsRepository,
    private readonly chats: ChatsRepository
  ) {}

  async record(input: UsageRecordInput) {
    this.invalidateUser(input.userId, input.workspaceId);
    const event = await this.usage.create({ ...input, totalTokens: input.inputTokens + input.outputTokens, createdAt: new Date() } as any);
    if (input.projectId) await this.projects.incrementUsage(input.projectId, input.userId, input.inputTokens, input.outputTokens, input.costUsd, input.workspaceId);
    if (input.workflowRunId) await this.runs.incrementUsage(input.workflowRunId, input.userId, input.inputTokens, input.outputTokens, input.costUsd, input.workspaceId);
    if (input.chatId) await this.chats.incrementUsage(input.chatId, input.userId, input.inputTokens, input.outputTokens, input.costUsd, input.workspaceId);
    return event;
  }

  private invalidateUser(userId: ObjectId, workspaceId: ObjectId) {
    const prefix = `${userId.toHexString()}:${workspaceId.toHexString()}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }

  private async cached<T>(userId: ObjectId, workspaceId: ObjectId, scope: string, load: () => Promise<T>, ttlMs = 10_000): Promise<T> {
    const key = `${userId.toHexString()}:${workspaceId.toHexString()}:${scope}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;
    const value = await load();
    this.cache.set(key, { expiresAt: Date.now() + ttlMs, value });
    return value;
  }

  async summary(userId: ObjectId, workspaceId: ObjectId) {
    return this.cached(userId, workspaceId, "summary", async () => {
      const rows = await this.usage.collection().aggregate([
        { $match: { userId, workspaceId } },
        {
          $group: {
            _id: null,
            inputTokens: { $sum: "$inputTokens" },
            outputTokens: { $sum: "$outputTokens" },
            totalTokens: { $sum: "$totalTokens" },
            costUsd: { $sum: "$costUsd" },
            unavailableCostEvents: { $sum: { $cond: [{ $eq: ["$costSource", "unavailable"] }, 1, 0] } },
            estimatedCostEvents: { $sum: { $cond: [{ $eq: ["$costSource", "estimated"] }, 1, 0] } }
          }
        }
      ]).toArray();
      return rows[0] ?? { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, unavailableCostEvents: 0, estimatedCostEvents: 0 };
    });
  }

  byProvider(userId: ObjectId, workspaceId: ObjectId) { return this.groupBy(userId, workspaceId, "$providerType"); }
  byModel(userId: ObjectId, workspaceId: ObjectId) { return this.groupBy(userId, workspaceId, "$modelName"); }
  byProject(userId: ObjectId, workspaceId: ObjectId) { return this.groupBy(userId, workspaceId, "$projectId"); }

  daily(userId: ObjectId, workspaceId: ObjectId) {
    return this.cached(userId, workspaceId, "daily", () =>
      this.usage.collection().aggregate([
        { $match: { userId, workspaceId } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            inputTokens: { $sum: "$inputTokens" },
            outputTokens: { $sum: "$outputTokens" },
            totalTokens: { $sum: "$totalTokens" },
            costUsd: { $sum: "$costUsd" },
            unavailableCostEvents: { $sum: { $cond: [{ $eq: ["$costSource", "unavailable"] }, 1, 0] } }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 90 },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", inputTokens: 1, outputTokens: 1, totalTokens: 1, unavailableCostEvents: 1, costUsd: { $round: ["$costUsd", 6] } } }
      ]).toArray()
    );
  }

  async budgetAlerts(userId: ObjectId, workspaceId: ObjectId) {
    const summary = await this.summary(userId, workspaceId);
    const monthlyBudgetUsd = 100;
    const pct = monthlyBudgetUsd ? Number(summary.costUsd ?? 0) / monthlyBudgetUsd : 0;
    const alerts = [];
    if (pct >= 0.95) alerts.push({ level: "critical", message: "95% monthly budget used", usedCostUsd: summary.costUsd, budgetUsd: monthlyBudgetUsd });
    else if (pct >= 0.8) alerts.push({ level: "warning", message: "80% monthly budget used", usedCostUsd: summary.costUsd, budgetUsd: monthlyBudgetUsd });
    else if (pct >= 0.5) alerts.push({ level: "info", message: "50% monthly budget used", usedCostUsd: summary.costUsd, budgetUsd: monthlyBudgetUsd });
    return alerts;
  }

  private groupBy(userId: ObjectId, workspaceId: ObjectId, field: string) {
    return this.cached(userId, workspaceId, `group:${field}`, () =>
      this.usage.collection().aggregate([
        { $match: { userId, workspaceId } },
        {
          $group: {
            _id: field,
            tokens: { $sum: "$totalTokens" },
            costUsd: { $sum: "$costUsd" },
            unavailableCostEvents: { $sum: { $cond: [{ $eq: ["$costSource", "unavailable"] }, 1, 0] } }
          }
        },
        { $sort: { costUsd: -1 } },
        { $limit: 50 }
      ]).toArray()
    );
  }
}
