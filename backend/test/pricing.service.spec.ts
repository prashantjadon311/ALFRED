import { ObjectId } from "mongodb";
import { PricingService } from "../src/modules/pricing/pricing.service";
import { PricingSnapshotDoc } from "../src/repositories/pricing-snapshots.repository";

function snapshot(input: Partial<PricingSnapshotDoc> & Pick<PricingSnapshotDoc, "modelName" | "effectiveFrom">): PricingSnapshotDoc {
  return {
    _id: new ObjectId(),
    providerType: "openai",
    currency: "USD",
    inputUsdPerMTok: 2,
    outputUsdPerMTok: 6,
    source: "test",
    createdAt: input.effectiveFrom,
    ...input
  };
}

function makeService(docs: PricingSnapshotDoc[]) {
  const snapshots = {
    collection: jest.fn(() => ({ findOne: jest.fn() })),
    create: jest.fn(),
    findEffective: jest.fn(async (providerType: string, modelNames: string[], requestedAt: Date) =>
      docs
        .filter((doc) =>
          doc.providerType === providerType
          && modelNames.includes(doc.modelName)
          && doc.effectiveFrom <= requestedAt
          && (!doc.effectiveTo || doc.effectiveTo > requestedAt)
        )
        .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
    )
  };
  return new PricingService(snapshots as any);
}

describe("PricingService", () => {
  it("selects the snapshot effective at the request timestamp", async () => {
    const january = snapshot({ modelName: "gpt-test", effectiveFrom: new Date("2026-01-01T00:00:00Z") });
    const june = snapshot({ modelName: "gpt-test", effectiveFrom: new Date("2026-06-01T00:00:00Z"), inputUsdPerMTok: 4 });
    const service = makeService([january, june]);

    const resolved = await service.resolveSnapshot("openai", ["gpt-test"], new Date("2026-03-01T00:00:00Z"));

    expect(resolved?._id).toEqual(january._id);
  });

  it("calculates input and output cost per million tokens", async () => {
    const service = makeService([snapshot({ modelName: "gpt-test", effectiveFrom: new Date(0) })]);

    const result = await service.calculateCost({
      providerType: "openai",
      modelName: "gpt-test",
      usage: { inputTokens: 1_000_000, outputTokens: 500_000, usageSource: "exact" },
      requestedAt: new Date()
    });

    expect(result.costUsd).toBe(5);
    expect(result.costSource).toBe("exact");
    expect(result.pricingSnapshotId).toBeTruthy();
  });

  it("uses configured cached and reasoning rates without double charging", async () => {
    const service = makeService([snapshot({
      modelName: "gpt-test",
      effectiveFrom: new Date(0),
      cachedInputUsdPerMTok: 1,
      reasoningUsdPerMTok: 10
    })]);

    const result = await service.calculateCost({
      providerType: "openai",
      modelName: "gpt-test",
      usage: { inputTokens: 1000, outputTokens: 500, cachedInputTokens: 400, reasoningTokens: 100, usageSource: "estimated" },
      requestedAt: new Date()
    });

    expect(result.costUsd).toBe(0.005);
    expect(result.costSource).toBe("estimated");
  });

  it("uses separate cache-read and cache-write input rates", async () => {
    const service = makeService([snapshot({
      modelName: "gpt-test",
      effectiveFrom: new Date(0),
      cachedInputUsdPerMTok: 0.5,
      cacheWriteInputUsdPerMTok: 3
    })]);

    const result = await service.calculateCost({
      providerType: "openai",
      modelName: "gpt-test",
      usage: {
        inputTokens: 1000,
        outputTokens: 0,
        cachedInputTokens: 300,
        cacheWriteInputTokens: 200,
        usageSource: "exact"
      },
      requestedAt: new Date()
    });

    expect(result.costUsd).toBe(0.00175);
  });

  it("returns unavailable instead of an exact zero when pricing is missing", async () => {
    const result = await makeService([]).calculateCost({
      providerType: "openai",
      modelName: "missing",
      usage: { inputTokens: 100, outputTokens: 20, usageSource: "exact" },
      requestedAt: new Date()
    });

    expect(result).toEqual({ costUsd: 0, costSource: "unavailable" });
  });

  it("falls back from provider-returned model to requested model", async () => {
    const configured = snapshot({
      modelName: "gpt-configured",
      effectiveFrom: new Date(0)
    });

    const service = makeService([configured]);

    const result = await service.calculateCost({
      providerType: "openai",
      modelName: "gpt-configured-2026-06-01",
      requestedModelName: "gpt-configured",
      usage: {
        inputTokens: 1000,
        outputTokens: 500,
        usageSource: "exact"
      },
      requestedAt: new Date()
    });

    expect(result.pricingSnapshotId).toBe(
      configured._id?.toHexString()
    );
  });
});
