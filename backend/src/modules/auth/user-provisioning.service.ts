import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { AiModelsRepository } from "../../repositories/ai-models.repository";
import { ModelProvidersRepository } from "../../repositories/model-providers.repository";
import { PromptsRepository } from "../../repositories/prompts.repository";
import { SettingsRepository } from "../../repositories/settings.repository";
import { WorkspacesRepository } from "../../repositories/workspaces.repository";

const mockModels = [
  { name: "Mock GPT-5", displayName: "Mock GPT-5 (Offline)", contextWindow: 400000, inputCostPer1k: 0.002, outputCostPer1k: 0.006, latencyClass: "fast", qualityClass: "high", defaultRole: "designer" },
  { name: "Mock Claude Opus", displayName: "Mock Claude Opus (Offline)", contextWindow: 200000, inputCostPer1k: 0.003, outputCostPer1k: 0.015, latencyClass: "medium", qualityClass: "premium_reasoning", defaultRole: "critic" },
  { name: "Mock Gemini", displayName: "Mock Gemini 2.0 (Offline)", contextWindow: 1000000, inputCostPer1k: 0.0015, outputCostPer1k: 0.004, latencyClass: "fast", qualityClass: "high", defaultRole: "architect" }
];

const defaultPrompts = [
  { key: "default.chatgpt_designer.v1", title: "ChatGPT Designer v1", category: "agent_role", tags: ["chatgpt_designer_v1", "product_design"], content: "You are A.L.F.R.E.D.'s product design agent. Preserve the locked requirement and return structured product design JSON." },
  { key: "default.claude_critic.v1", title: "Claude Critic v1", category: "claude_critic", tags: ["claude_critic_v1"], content: "You are A.L.F.R.E.D.'s strict critic. Check requirement drift, quality risks, and governance issues. Return structured JSON." },
  { key: "default.codex_prompt_generator.v1", title: "Codex Prompt Generator v1", category: "codex_prompt", tags: ["codex_prompt_generator_v1"], content: "You are A.L.F.R.E.D.'s Codex prompt generator. Produce phased implementation prompts grounded in the approved final output." }
];

@Injectable()
export class UserProvisioningService {
  constructor(
    private readonly workspaces: WorkspacesRepository,
    private readonly providers: ModelProvidersRepository,
    private readonly models: AiModelsRepository,
    private readonly settings: SettingsRepository,
    private readonly prompts: PromptsRepository
  ) {}

  async provision(userId: ObjectId) {
    const workspaceId = await this.ensureWorkspace(userId);
    const providerId = await this.ensureMockProvider(userId);
    await this.ensureMockModels(userId, providerId);
    await this.ensureSettings(userId);
    await this.ensurePrompts(userId, workspaceId);
    return { workspaceId };
  }

  private async ensureWorkspace(userId: ObjectId) {
    const active = await this.workspaces.collection().findOne({ userId, active: true, archived: { $ne: true } } as any);
    if (active?._id) return active._id;

    const existing = await this.workspaces.collection().findOne({ userId, name: "My Workspace", archived: { $ne: true } } as any);
    if (existing?._id) {
      await this.workspaces.setActive(userId, existing._id);
      return existing._id;
    }

    const workspace = await this.workspaces.create({
      userId,
      name: "My Workspace",
      description: "",
      plan: "free",
      active: true,
      archived: false,
      defaultProvider: "mock",
      defaultModel: "Mock GPT-5",
      monthlyTokenLimit: 100000,
      monthlyCostLimit: 25,
      themePreference: "dark",
      createdAt: new Date()
    } as any);
    return workspace!._id!;
  }

  private async ensureMockProvider(userId: ObjectId) {
    const existing = await this.providers.collection().findOne({ userId, providerType: "mock" } as any);
    if (existing?._id) return existing._id;
    const provider = await this.providers.create({
      userId,
      name: "Mock (Default)",
      providerType: "mock",
      maskedApiKey: "mock-mode",
      enabled: true,
      healthStatus: "healthy",
      config: { mockMode: true },
      createdAt: new Date()
    } as any);
    return provider!._id!;
  }

  private async ensureMockModels(userId: ObjectId, providerId: ObjectId) {
    for (const model of mockModels) {
      const existing = await this.models.collection().findOne({ userId, providerType: "mock", name: model.name } as any);
      if (existing) continue;
      await this.models.create({ userId, providerId, providerType: "mock", enabled: true, ...model, createdAt: new Date() } as any);
    }
  }

  private async ensureSettings(userId: ObjectId) {
    await this.settings.upsert(userId, "theme", "dark");
    await this.settings.upsert(userId, "mockMode", true);
    await this.settings.upsert(userId, "defaultProvider", "mock");
    await this.settings.upsert(userId, "defaultModel", "Mock GPT-5");
  }

  private async ensurePrompts(userId: ObjectId, workspaceId: ObjectId) {
    for (const prompt of defaultPrompts) {
      const existing = await this.prompts.collection().findOne({ userId, key: prompt.key } as any);
      if (existing) continue;
      await this.prompts.create({ userId, workspaceId, ...prompt, favorite: false, version: 1, createdAt: new Date() } as any);
    }
  }
}
