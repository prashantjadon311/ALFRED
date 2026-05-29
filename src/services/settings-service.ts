import { budgetRules as mockBudget, promptLibrary as mockPrompts } from "@/lib/mock-data";
import type { BudgetRule, PromptItem } from "@/lib/types";

const wait = () => new Promise((resolve) => setTimeout(resolve, 120));

export const settingsService = {
  getBudgetRules: async (): Promise<BudgetRule[]> => {
    await wait();
    return mockBudget;
  },

  getPrompts: async (): Promise<PromptItem[]> => {
    await wait();
    return mockPrompts;
  },

  createPrompt: async (body: { title: string; category: string; content: string; tags?: string[] }): Promise<PromptItem> => {
    await wait();
    return {
      id: `prompt-${Date.now()}`,
      title: body.title,
      category: body.category,
      description: body.tags?.join(", ") || "Mock prompt template",
      prompt: body.content,
      favorite: false,
      updatedAt: new Date().toISOString()
    };
  },

  toggleFavoritePrompt: async (id: string): Promise<PromptItem> => {
    await wait();
    const prompt = mockPrompts.find((item) => item.id === id) ?? mockPrompts[0];
    return { ...prompt, favorite: !prompt.favorite };
  },

  deletePrompt: async (_id: string) => {
    await wait();
    return { deleted: true };
  },

  getSettings: async () => {
    await wait();
    return { mockMode: true, backendReady: true };
  },

  saveSettings: async (settings: Record<string, unknown>) => {
    await wait();
    return { settings, saved: true };
  }
};
