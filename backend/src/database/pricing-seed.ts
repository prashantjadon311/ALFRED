import { Db } from "mongodb";

const repositoryMockPrices = [
  { providerType: "mock", modelName: "Mock GPT-5", inputUsdPerMTok: 2, outputUsdPerMTok: 6 },
  { providerType: "mock", modelName: "GPT-5", inputUsdPerMTok: 2, outputUsdPerMTok: 6 },
  { providerType: "mock", modelName: "Mock Claude Opus", inputUsdPerMTok: 2, outputUsdPerMTok: 6 },
  { providerType: "mock", modelName: "Mock Gemini", inputUsdPerMTok: 2, outputUsdPerMTok: 6 },
  { providerType: "mock", modelName: "Mock Local", inputUsdPerMTok: 2, outputUsdPerMTok: 6 },
  { providerType: "mock", modelName: "Mock GPT-5 Codex", inputUsdPerMTok: 2, outputUsdPerMTok: 6 }
];

export async function ensureRepositoryPricingSnapshots(db: Db) {
  const effectiveFrom = new Date(0);
  const source = "repository:mock-provider-v1";
  await db.collection("pricing_snapshots").bulkWrite(repositoryMockPrices.map((price) => ({
    updateOne: {
      filter: { providerType: price.providerType, modelName: price.modelName, effectiveFrom, source },
      update: {
        $setOnInsert: {
          ...price,
          currency: "USD",
          effectiveFrom,
          source,
          createdAt: new Date()
        }
      },
      upsert: true
    }
  })));
}
