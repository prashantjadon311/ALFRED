import { api, isApiMode } from "@/lib/api-client";
import { providerCosts, providers, workflows } from "@/lib/mocks/dashboard";
import type { ModelProvider, WorkflowRun } from "@/lib/types";

type DashboardSummary = {
  totalProjects: number;
  activeRuns: number;
  waitingApprovals: number;
  failedRuns: number;
  totalTokens: number;
  totalCost: number;
  providerCosts: Array<{ name: string; value: number }>;
  providers: ModelProvider[];
  workflows: WorkflowRun[];
};

const health = (value?: string): ModelProvider["health"] => value === "healthy" ? "Healthy" : value === "degraded" ? "Degraded" : "Offline";
const title = (value?: string) => (value ? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "");

function normalizeProvider(provider: any): ModelProvider {
  return {
    id: provider.id ?? provider.providerType ?? provider.name,
    name: provider.name ?? title(provider.providerType),
    enabled: Boolean(provider.enabled),
    maskedApiKey: provider.maskedApiKey ?? "not configured",
    baseUrl: provider.baseUrl ?? "",
    defaultModel: provider.config?.defaultModel ?? provider.providerType ?? "mock",
    health: health(provider.healthStatus),
    inputCost: provider.inputCost ?? 0,
    outputCost: provider.outputCost ?? 0,
    rateLimit: provider.config?.rateLimit ?? "mock"
  };
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    if (!isApiMode()) {
      return {
        totalProjects: 5,
        activeRuns: workflows.filter((workflow) => workflow.status === "Running" || workflow.status === "Waiting Approval").length,
        waitingApprovals: 3,
        failedRuns: 1,
        totalTokens: 3859350,
        totalCost: 749.55,
        providerCosts,
        providers,
        workflows
      };
    }
    const summary = await api.get<any>("/dashboard/summary");
    const byWorkflowStatus = summary.workflowStats?.byStatus ?? {};
    const usage = summary.usageSummary ?? {};
    return {
      totalProjects: summary.projectStats?.total ?? 0,
      activeRuns: (byWorkflowStatus.running ?? 0) + (byWorkflowStatus.queued ?? 0),
      waitingApprovals: byWorkflowStatus.waiting_approval ?? byWorkflowStatus.needs_human_review ?? 0,
      failedRuns: byWorkflowStatus.failed ?? 0,
      totalTokens: usage.totalTokens ?? 0,
      totalCost: usage.costUsd ?? 0,
      providerCosts,
      providers: (summary.providerHealth ?? []).map(normalizeProvider),
      workflows
    };
  }
};
