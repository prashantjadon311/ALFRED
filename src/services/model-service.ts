import { models as mockModels, providers as mockProviders } from "@/lib/mock-data";
import type { ModelConfig, ModelProvider } from "@/lib/types";

const wait = () => new Promise((resolve) => setTimeout(resolve, 120));

export const modelService = {
  listProviders: async (): Promise<ModelProvider[]> => {
    await wait();
    return mockProviders;
  },

  listModels: async (): Promise<ModelConfig[]> => {
    await wait();
    return mockModels;
  },

  testConnection: async (providerId: string) => {
    await wait();
    const provider = mockProviders.find((item) => item.id === providerId);
    return {
      providerId,
      ok: provider?.health !== "Offline",
      message: provider?.health === "Offline" ? "Mock provider is disabled." : "Mock health check passed. No network request was made."
    };
  },

  updateProvider: async (id: string, patch: Partial<ModelProvider>): Promise<ModelProvider> => {
    await wait();
    const provider = mockProviders.find((item) => item.id === id) ?? mockProviders[0];
    return { ...provider, ...patch };
  },

  updateModel: async (id: string, patch: Partial<ModelConfig>): Promise<ModelConfig> => {
    await wait();
    const model = mockModels.find((item) => item.id === id) ?? mockModels[0];
    return { ...model, ...patch };
  }
};
