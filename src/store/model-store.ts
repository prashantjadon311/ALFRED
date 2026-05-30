import { create } from "zustand";
import { models as mockModels, providers as mockProviders } from "@/lib/mock-data";
import { modelService } from "@/services/model-service";
import type { ModelConfig, ModelProvider } from "@/lib/types";

interface ModelStore {
  providers: ModelProvider[];
  models: ModelConfig[];
  selectedModel: string;
  loaded: boolean;
  setSelectedModel: (model: string) => void;
  updateProviderConfig: (providerId: string, patch: Partial<ModelProvider>) => void;
  updateModelConfig: (modelId: string, patch: Partial<ModelConfig>) => void;
  loadFromApi: () => Promise<void>;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  providers: mockProviders,
  models: mockModels,
  selectedModel: "Mock GPT-5",
  loaded: false,

  setSelectedModel: (model) => set({ selectedModel: model }),

  updateProviderConfig: (providerId, patch) =>
    set((state) => {
      void modelService.updateProvider(providerId, patch).catch(() => undefined);
      return { providers: state.providers.map((p) => p.id === providerId ? { ...p, ...patch } : p) };
    }),
  updateModelConfig: (modelId, patch) =>
    set((state) => {
      void modelService.updateModel(modelId, patch).catch(() => undefined);
      return { models: state.models.map((model) => model.id === modelId ? { ...model, ...patch } : model) };
    }),

  loadFromApi: async () => {
    if (get().loaded) return;
    try {
      const [providers, models] = await Promise.all([modelService.listProviders(), modelService.listModels()]);
      if (providers.length > 0 || models.length > 0) {
        set({ providers: providers.length ? providers : mockProviders, models: models.length ? models : mockModels, loaded: true });
      }
    } catch { /* keep mock data */ }
  }
}));
