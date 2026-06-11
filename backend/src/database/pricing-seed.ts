import { Db } from "mongodb";

const repositoryPrices = [
  {
    providerType: "mock",
    modelName: "Mock GPT-5",
    inputUsdPerMTok: 2,
    outputUsdPerMTok: 6
  },
  {
    providerType: "mock",
    modelName: "GPT-5",
    inputUsdPerMTok: 2,
    outputUsdPerMTok: 6
  },
  {
    providerType: "mock",
    modelName: "Mock GPT-5 Codex",
    inputUsdPerMTok: 2,
    outputUsdPerMTok: 6
  },
  {
    providerType: "mock",
    modelName: "Mock Claude Opus",
    inputUsdPerMTok: 3,
    outputUsdPerMTok: 15
  },
  {
    providerType: "mock",
    modelName: "Mock Gemini",
    inputUsdPerMTok: 1.5,
    outputUsdPerMTok: 4
  },
  {
    providerType: "mock",
    modelName: "Mock Local",
    inputUsdPerMTok: 0,
    outputUsdPerMTok: 0
  },

  // These values reproduce the existing repository model catalogue.
  // They are repository-configured values, not provider-verified live prices.
  {
    providerType: "openai",
    modelName: "gpt-5",
    inputUsdPerMTok: 2,
    outputUsdPerMTok: 6
  },
  {
    providerType: "anthropic",
    modelName: "claude-opus-4-7",
    inputUsdPerMTok: 3,
    outputUsdPerMTok: 15
  },
  {
    providerType: "gemini",
    modelName: "gemini-2.0-flash",
    inputUsdPerMTok: 1.5,
    outputUsdPerMTok: 4
  },
  {
    providerType: "ollama",
    modelName: "llama3.2",
    inputUsdPerMTok: 0,
    outputUsdPerMTok: 0
  }
];

export async function ensureRepositoryPricingSnapshots(db: Db) {
  const effectiveFrom = new Date(0);
  const source = "repository:configured-model-catalog-v2";
  await db.collection("pricing_snapshots").bulkWrite(repositoryPrices.map((price) => ({
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
