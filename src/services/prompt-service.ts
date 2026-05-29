import { promptLibrary } from "@/lib/mock-data";
import type { PromptItem } from "@/lib/types";

const wait = () => new Promise((resolve) => setTimeout(resolve, 120));

export const promptService = {
  getPromptLibrary: async (): Promise<PromptItem[]> => {
    await wait();
    return promptLibrary;
  },

  getPromptById: async (id: string): Promise<PromptItem> => {
    await wait();
    return promptLibrary.find((prompt) => prompt.id === id) ?? promptLibrary[0];
  },

  savePrompt: async (prompt: Omit<PromptItem, "id" | "updatedAt"> & { id?: string }): Promise<PromptItem> => {
    await wait();
    return { ...prompt, id: prompt.id ?? `prompt-${Date.now()}`, updatedAt: new Date().toISOString() };
  },

  toggleFavorite: async (id: string): Promise<PromptItem> => {
    await wait();
    const prompt = promptLibrary.find((item) => item.id === id) ?? promptLibrary[0];
    return { ...prompt, favorite: !prompt.favorite };
  }
};
