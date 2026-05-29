import { Injectable } from "@nestjs/common";

export interface BudgetSnapshot {
  maxTokens: number;
  usedTokens: number;
  remainingTokens: number;
  maxCostUsd: number;
  usedCostUsd: number;
  remainingCostUsd: number;
  mode: "normal" | "compress" | "pause" | "stop";
  warnings: string[];
}

@Injectable()
export class BudgetService {
  calculateCost(inputTokens: number, outputTokens: number, inputCostPer1k = 0.002, outputCostPer1k = 0.006) {
    return Number(((inputTokens / 1000) * inputCostPer1k + (outputTokens / 1000) * outputCostPer1k).toFixed(6));
  }

  buildSnapshot(maxTokens: number, usedTokens: number, maxCostUsd: number, usedCostUsd: number): BudgetSnapshot {
    const remainingTokens = Math.max(0, maxTokens - usedTokens);
    const remainingCostUsd = Math.max(0, Number((maxCostUsd - usedCostUsd).toFixed(6)));
    const tokenPct = maxTokens ? usedTokens / maxTokens : 0;
    const costPct = maxCostUsd ? usedCostUsd / maxCostUsd : 0;
    const pct = Math.max(tokenPct, costPct);
    const warnings: string[] = [];
    if (pct >= 0.5) warnings.push("50% budget used");
    if (pct >= 0.8) warnings.push("80% budget used");
    if (pct >= 0.95) warnings.push("95% budget used");
    const mode = pct >= 1 ? "stop" : pct >= 0.95 ? "pause" : pct >= 0.8 ? "compress" : "normal";
    return { maxTokens, usedTokens, remainingTokens, maxCostUsd, usedCostUsd, remainingCostUsd, mode, warnings };
  }

  assertCanSpend(snapshot: BudgetSnapshot, estimatedTokens: number, estimatedCostUsd: number) {
    if (snapshot.mode === "stop") return { allowed: false, reason: "Budget exhausted" };
    if (estimatedTokens > snapshot.remainingTokens) return { allowed: false, reason: "Token budget would be exceeded" };
    if (estimatedCostUsd > snapshot.remainingCostUsd) return { allowed: false, reason: "Cost budget would be exceeded" };
    return { allowed: true };
  }
}
