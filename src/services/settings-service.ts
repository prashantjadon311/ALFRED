import { promptLibrary as mockPrompts } from "@/lib/mocks/prompts";
import { budgetRules as mockBudget } from "@/lib/mocks/usage";
import { api, isApiMode } from "@/lib/api-client";
import type { BudgetRule, PromptItem } from "@/lib/types";
import { demoWait } from "./mock-latency";

const wait = () => demoWait(120);
const categoryMap: Record<string, string> = {
  "Product Design": "product_design",
  "Software Architecture": "software_architecture",
  Research: "research",
  "Code Review": "code_review",
  "QA Audit": "qa_audit",
  "Agent Roles": "agent_role",
  "Codex Prompts": "codex_prompt"
};

export const settingsService = {
  getBudgetRules: async (): Promise<BudgetRule[]> => {
    await wait();
    return mockBudget;
  },

  getPrompts: async (): Promise<PromptItem[]> => {
    if (isApiMode()) return (await api.get<any[]>("/prompts")).map((prompt) => ({
      id: prompt.id,
      title: prompt.title,
      category: prompt.category,
      description: Array.isArray(prompt.tags) ? prompt.tags.join(", ") : "",
      prompt: prompt.content,
      favorite: Boolean(prompt.favorite),
      updatedAt: prompt.updatedAt
    }));
    await wait();
    return mockPrompts;
  },

  createPrompt: async (body: { title: string; category: string; content: string; tags?: string[] }): Promise<PromptItem> => {
    if (isApiMode()) {
      const prompt = await api.post<any>("/prompts", { ...body, category: categoryMap[body.category] ?? body.category.toLowerCase().replace(/[^a-z0-9]+/g, "_") });
      return { id: prompt.id, title: prompt.title, category: prompt.category, description: prompt.tags?.join(", ") ?? "", prompt: prompt.content, favorite: Boolean(prompt.favorite), updatedAt: prompt.updatedAt };
    }
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
    if (isApiMode()) {
      const prompt = await api.post<any>(`/prompts/${id}/favorite`);
      return { id: prompt.id, title: prompt.title, category: prompt.category, description: prompt.tags?.join(", ") ?? "", prompt: prompt.content, favorite: Boolean(prompt.favorite), updatedAt: prompt.updatedAt };
    }
    await wait();
    const prompt = mockPrompts.find((item) => item.id === id) ?? mockPrompts[0];
    return { ...prompt, favorite: !prompt.favorite };
  },

  deletePrompt: async (_id: string) => {
    if (isApiMode()) return api.delete(`/prompts/${_id}`);
    await wait();
    return { deleted: true };
  },

  getSettings: async () => {
    if (isApiMode()) return api.get<Record<string, unknown>>("/settings");
    await wait();
    return { mockMode: true, backendReady: true };
  },

  saveSettings: async (settings: Record<string, unknown>) => {
    if (isApiMode()) return { settings: await api.patch<Record<string, unknown>>("/settings", settings), saved: true };
    await wait();
    return { settings, saved: true };
  }
};
