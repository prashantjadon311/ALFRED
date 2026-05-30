import { budgetRules as mockBudget, projectCosts as mockProjectCosts, providerCosts as mockProviderCosts, usageSeries as mockSeries } from "@/lib/mock-data";
import { api, isApiMode } from "@/lib/api-client";
import { demoWait } from "./mock-latency";

const wait = () => demoWait(120);

export const usageService = {
  getUsageSeries: async () => {
    if (isApiMode()) return (await api.get<any[]>("/usage/daily")).map((point) => ({ date: point.date, input: point.inputTokens ?? 0, output: point.outputTokens ?? 0, cost: point.costUsd ?? 0 }));
    await wait();
    return mockSeries;
  },

  getProviderCosts: async () => {
    if (isApiMode()) return (await api.get<any[]>("/usage/by-provider")).map((row) => ({ provider: row._id ?? "unknown", cost: row.costUsd ?? 0, tokens: row.tokens ?? 0 }));
    await wait();
    return mockProviderCosts;
  },

  getProjectCosts: async () => {
    if (isApiMode()) return (await api.get<any[]>("/usage/by-project")).map((row) => ({ project: row._id ?? "unknown", cost: row.costUsd ?? 0, tokens: row.tokens ?? 0 }));
    await wait();
    return mockProjectCosts;
  },

  getUsageSummary: async () => {
    if (isApiMode()) return api.get("/usage/summary");
    await wait();
    const inputTokens = mockSeries.reduce((sum, point) => sum + point.input, 0);
    const outputTokens = mockSeries.reduce((sum, point) => sum + point.output, 0);
    const costUsd = mockSeries.reduce((sum, point) => sum + point.cost, 0);
    return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, costUsd };
  },

  getSummary: async () => usageService.getUsageSummary(),

  getBudgetAlerts: async () => {
    if (isApiMode()) return api.get("/usage/budget-alerts");
    await wait();
    return [
      { id: "alert-001", title: "80% monthly budget used", severity: "High", projectId: "alfred-platform" },
      { id: "alert-002", title: "Claude critic loop near cap", severity: "Medium", providerId: "claude" }
    ];
  },

  getBudgetRules: async () => {
    await wait();
    return mockBudget;
  }
};
