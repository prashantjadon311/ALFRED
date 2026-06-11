import { LlmGatewayController } from "../src/modules/llm-gateway/llm-gateway.controller";

describe("LlmGatewayController estimate cost", () => {
  it("uses server pricing and ignores arbitrary client rate fields", async () => {
    const llm = {
      estimateTokens: jest.fn(async (text: string) => text.length)
    };
    const pricing = {
      calculateCost: jest.fn(async () => ({
        costUsd: 0.012,
        pricingSnapshotId: "snapshot-id",
        costSource: "estimated"
      }))
    };
    const controller = new LlmGatewayController(
      llm as any,
      {} as any,
      {} as any,
      pricing as any
    );

    const response = await controller.estimateCost(
      {} as any,
      {
        providerType: "openai",
        modelName: "gpt-test",
        inputText: "input",
        outputText: "out",
        inputCostPer1k: 999,
        outputCostPer1k: 999
      } as any
    );

    expect(pricing.calculateCost).toHaveBeenCalledWith(
      expect.objectContaining({
        providerType: "openai",
        modelName: "gpt-test",
        requestedModelName: "gpt-test",
        usage: {
          inputTokens: 5,
          outputTokens: 3,
          usageSource: "estimated"
        }
      })
    );
    expect(response.data).toEqual(
      expect.objectContaining({
        costUsd: 0.012,
        pricingSnapshotId: "snapshot-id"
      })
    );
    expect(response.data).not.toHaveProperty("inputCost");
    expect(response.data).not.toHaveProperty("outputCost");
  });
});
