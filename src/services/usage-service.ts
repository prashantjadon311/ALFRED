import { budgetRules as mockBudget, projectCosts as mockProjectCosts, providerCosts as mockProviderCosts, usageSeries as mockSeries } from "@/lib/mock-data";

const wait = () => new Promise((resolve) => setTimeout(resolve, 120));

export const usageService = {
  getUsageSeries: async () => {
    await wait();
    return mockSeries;
  },

  getProviderCosts: async () => {
    await wait();
    return mockProviderCosts;
  },

  getProjectCosts: async () => {
    await wait();
    return mockProjectCosts;
  },

  getUsageSummary: async () => {
    await wait();
    const inputTokens = mockSeries.reduce((sum, point) => sum + point.input, 0);
    const outputTokens = mockSeries.reduce((sum, point) => sum + point.output, 0);
    const costUsd = mockSeries.reduce((sum, point) => sum + point.cost, 0);
    return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, costUsd };
  },

  getSummary: async () => usageService.getUsageSummary(),

  getBudgetAlerts: async () => {
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
