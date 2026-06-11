import { models as mockModels, providers as mockProviders } from "@/lib/mock-data";
import { api, isApiMode } from "@/lib/api-client";
import type { ModelConfig, ModelProvider } from "@/lib/types";
import { demoWait } from "./mock-latency";

const wait = () => demoWait(120);
const health = (value?: string): ModelProvider["health"] => value === "healthy" ? "Healthy" : value === "degraded" ? "Degraded" : "Offline";

function normalizeProvider(provider: any): ModelProvider {
  return {
    id: provider.id,
    name: provider.name,
    enabled: Boolean(provider.enabled),
    maskedApiKey: provider.maskedApiKey ?? "not configured",
    baseUrl: provider.baseUrl ?? "",
    defaultModel: provider.config?.defaultModel ?? provider.providerType,
    health: health(provider.healthStatus),
    inputCost: provider.inputCost ?? 0,
    outputCost: provider.outputCost ?? 0,
    rateLimit: provider.config?.rateLimit ?? "mock"
  };
}

function normalizeModel(model: any): ModelConfig {
  return {
    id: model.id,
    provider: model.providerType ?? model.provider ?? "mock",
    name: model.displayName ?? model.name,
    contextWindow: model.contextWindow ?? 0,
    inputCost:
      (model.inputCostPer1k ?? model.inputCost ?? 0) * 1000,
    outputCost:
      (model.outputCostPer1k ?? model.outputCost ?? 0) * 1000,
    defaultRole: model.defaultRole ?? "assistant",
    enabled: Boolean(model.enabled)
  };
}

export const modelService = {
  listProviders: async (): Promise<ModelProvider[]> => {
    if (isApiMode()) return (await api.get<any[]>("/model-providers")).map(normalizeProvider);
    await wait();
    return mockProviders;
  },

  listModels: async (): Promise<ModelConfig[]> => {
    if (isApiMode()) return (await api.get<any[]>("/models")).map(normalizeModel);
    await wait();
    return mockModels;
  },

  testConnection: async (providerId: string) => {
    if (isApiMode()) {
      const result = await api.post<{ status: string; message: string }>(`/model-providers/${providerId}/test`);
      return { providerId, ok: result.status === "healthy", message: result.message };
    }
    await wait();
    const provider = mockProviders.find((item) => item.id === providerId);
    return {
      providerId,
      ok: provider?.health !== "Offline",
      message: provider?.health === "Offline" ? "Mock provider is disabled." : "Mock health check passed. No network request was made."
    };
  },

  updateProvider: async (id: string, patch: Partial<ModelProvider>): Promise<ModelProvider> => {
    if (isApiMode()) return normalizeProvider(await api.patch<any>(`/model-providers/${id}`, { enabled: patch.enabled, name: patch.name, baseUrl: patch.baseUrl }));
    await wait();
    const provider = mockProviders.find((item) => item.id === id) ?? mockProviders[0];
    return { ...provider, ...patch };
  },

  updateModel: async (id: string, patch: Partial<ModelConfig>): Promise<ModelConfig> => {
    if (isApiMode()) return normalizeModel(await api.patch<any>(`/models/${id}`, {
      enabled: patch.enabled,
      defaultRole: patch.defaultRole
    }));
    await wait();
    const model = mockModels.find((item) => item.id === id) ?? mockModels[0];
    return { ...model, ...patch };
  }
};
