import { Injectable } from "@nestjs/common";
import { AiModelsRepository } from "../../repositories/ai-models.repository";
import { PricingSnapshotsRepository } from "../../repositories/pricing-snapshots.repository";
import { NormalizedUsage } from "../../llm/interfaces/llm.types";

export interface CostCalculation {
  costUsd: number;
  pricingSnapshotId?: string;
  costSource: "exact" | "estimated" | "unavailable";
}

@Injectable()
export class PricingService {
  constructor(
    private readonly snapshots: PricingSnapshotsRepository,
    private readonly aiModels: AiModelsRepository
  ) {}

  async calculateCost(input: {
    providerType: string;
    modelName: string;
    usage: NormalizedUsage;
    requestedAt: Date;
  }): Promise<CostCalculation> {
    const snapshot = await this.resolveSnapshot(input.providerType, input.modelName, input.requestedAt);
    if (!snapshot) return { costUsd: 0, costSource: "unavailable" };

    const cachedInputTokens = Math.min(input.usage.inputTokens, input.usage.cachedInputTokens ?? 0);
    const reasoningTokens = Math.min(input.usage.outputTokens, input.usage.reasoningTokens ?? 0);
    const regularInputTokens = snapshot.cachedInputUsdPerMTok === undefined
      ? input.usage.inputTokens
      : input.usage.inputTokens - cachedInputTokens;
    const regularOutputTokens = snapshot.reasoningUsdPerMTok === undefined
      ? input.usage.outputTokens
      : input.usage.outputTokens - reasoningTokens;

    const cost = (
      regularInputTokens * snapshot.inputUsdPerMTok
      + regularOutputTokens * snapshot.outputUsdPerMTok
      + (snapshot.cachedInputUsdPerMTok === undefined ? 0 : cachedInputTokens * snapshot.cachedInputUsdPerMTok)
      + (snapshot.reasoningUsdPerMTok === undefined ? 0 : reasoningTokens * snapshot.reasoningUsdPerMTok)
    ) / 1_000_000;

    return {
      costUsd: Number(cost.toFixed(12)),
      pricingSnapshotId: snapshot._id?.toHexString(),
      costSource: input.usage.usageSource === "exact" ? "exact" : "estimated"
    };
  }

  async resolveSnapshot(providerType: string, modelName: string, requestedAt: Date) {
    const exact = await this.snapshots.findEffective(providerType, [modelName], requestedAt);
    if (exact[0]) return exact[0];

    const aliases = await this.aiModels.collection().find({
      providerType,
      $or: [{ name: modelName }, { displayName: modelName }]
    } as any).project({ name: 1 }).toArray();
    const canonicalNames = [...new Set(aliases.map((model) => model.name).filter((name): name is string => typeof name === "string"))];
    if (canonicalNames.length !== 1 || canonicalNames[0] === modelName) return undefined;
    const aliased = await this.snapshots.findEffective(providerType, canonicalNames, requestedAt);
    return aliased[0];
  }
}
