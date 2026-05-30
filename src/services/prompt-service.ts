import { promptLibrary } from "@/lib/mocks/prompts";
import { api, isApiMode } from "@/lib/api-client";
import type { PromptItem } from "@/lib/types";
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
const categoryToApi = (value: string) => categoryMap[value] ?? (value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "agent_role");
const categoryToDisplay = (value: string) => value.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ").replace("Qa", "QA").replace("Codex Prompt", "Codex Prompts").replace("Agent Role", "Agent Roles");
function normalizePrompt(prompt: any): PromptItem {
  return {
    id: prompt.id,
    title: prompt.title,
    category: categoryToDisplay(prompt.category),
    description: Array.isArray(prompt.tags) ? prompt.tags.join(", ") : prompt.description ?? "",
    prompt: prompt.content ?? prompt.prompt ?? "",
    favorite: Boolean(prompt.favorite),
    updatedAt: prompt.updatedAt ?? prompt.createdAt
  };
}

export const promptService = {
  getPromptLibrary: async (): Promise<PromptItem[]> => {
    if (isApiMode()) return (await api.get<any[]>("/prompts")).map(normalizePrompt);
    await wait();
    return promptLibrary;
  },

  getPromptById: async (id: string): Promise<PromptItem> => {
    if (isApiMode()) return normalizePrompt(await api.get<any>(`/prompts/${id}`));
    await wait();
    return promptLibrary.find((prompt) => prompt.id === id) ?? promptLibrary[0];
  },

  savePrompt: async (prompt: Omit<PromptItem, "id" | "updatedAt"> & { id?: string }): Promise<PromptItem> => {
    if (isApiMode()) {
      const body = { title: prompt.title, category: categoryToApi(prompt.category), content: prompt.prompt, tags: prompt.description ? prompt.description.split(",").map((tag) => tag.trim()).filter(Boolean) : [] };
      return normalizePrompt(prompt.id ? await api.patch<any>(`/prompts/${prompt.id}`, body) : await api.post<any>("/prompts", body));
    }
    await wait();
    return { ...prompt, id: prompt.id ?? `prompt-${Date.now()}`, updatedAt: new Date().toISOString() };
  },

  toggleFavorite: async (id: string): Promise<PromptItem> => {
    if (isApiMode()) return normalizePrompt(await api.post<any>(`/prompts/${id}/favorite`));
    await wait();
    const prompt = promptLibrary.find((item) => item.id === id) ?? promptLibrary[0];
    return { ...prompt, favorite: !prompt.favorite };
  }
};
