import { Injectable } from "@nestjs/common";
import { PricingSnapshotsRepository } from "../../repositories/pricing-snapshots.repository";
import { NormalizedUsage } from "../../llm/interfaces/llm.types";

export interface CostCalculation {
  costUsd: number;
  pricingSnapshotId?: string;
  costSource: "exact" | "estimated" | "unavailable";
}

@Injectable()
export class PricingService {
  constructor(private readonly snapshots: PricingSnapshotsRepository) {}

  async calculateCost(input: {
    providerType: string;
    modelName: string;
    requestedModelName?: string;
    usage: NormalizedUsage;
    requestedAt: Date;
  }): Promise<CostCalculation> {
    const snapshot = await this.resolveSnapshot(
      input.providerType,
      [input.modelName, input.requestedModelName],
      input.requestedAt
    );
    if (!snapshot) return { costUsd: 0, costSource: "unavailable" };

    const inputTokens = Math.max(0, input.usage.inputTokens);
    const cachedReadTokens = Math.min(inputTokens, input.usage.cachedInputTokens ?? 0);
    const remainingAfterRead = inputTokens - cachedReadTokens;
    const cacheWriteTokens = Math.min(remainingAfterRead, input.usage.cacheWriteInputTokens ?? 0);
    const regularInputTokens = inputTokens - cachedReadTokens - cacheWriteTokens;
    const cachedReadRate = snapshot.cachedInputUsdPerMTok ?? snapshot.inputUsdPerMTok;
    const cacheWriteRate = snapshot.cacheWriteInputUsdPerMTok ?? snapshot.inputUsdPerMTok;
    const reasoningTokens = Math.min(input.usage.outputTokens, input.usage.reasoningTokens ?? 0);
    const regularOutputTokens = snapshot.reasoningUsdPerMTok === undefined
      ? input.usage.outputTokens
      : input.usage.outputTokens - reasoningTokens;

    const cost = (
      regularInputTokens * snapshot.inputUsdPerMTok
      + cachedReadTokens * cachedReadRate
      + cacheWriteTokens * cacheWriteRate
      + regularOutputTokens * snapshot.outputUsdPerMTok
      + (snapshot.reasoningUsdPerMTok === undefined ? 0 : reasoningTokens * snapshot.reasoningUsdPerMTok)
    ) / 1_000_000;

    return {
      costUsd: Number(cost.toFixed(12)),
      pricingSnapshotId: snapshot._id?.toHexString(),
      costSource: input.usage.usageSource === "exact" ? "exact" : "estimated"
    };
  }

  async resolveSnapshot(
    providerType: string,
    modelNames: Array<string | undefined>,
    requestedAt: Date
  ) {
    const candidates = [...new Set(
      modelNames
        .map((name) => name?.trim())
        .filter((name): name is string => Boolean(name))
    )];

    for (const modelName of candidates) {
      const matches = await this.snapshots.findEffective(
        providerType,
        [modelName],
        requestedAt
      );

      if (matches[0]) return matches[0];
    }

    return undefined;
  }
}
