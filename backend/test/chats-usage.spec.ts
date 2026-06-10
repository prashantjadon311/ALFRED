import { ObjectId } from "mongodb";
import { ChatsService } from "../src/modules/chats/chats.service";

function llmResult(overrides: Record<string, unknown> = {}) {
  return {
    content: "answer",
    providerType: "openai",
    modelName: "gpt-test",
    inputTokens: 10,
    outputTokens: 5,
    cachedInputTokens: 2,
    reasoningTokens: 1,
    usageSource: "exact" as const,
    costUsd: 0.00004,
    pricingSnapshotId: new ObjectId().toHexString(),
    costSource: "exact" as const,
    calculatedAt: new Date(),
    latencyMs: 12,
    ...overrides
  };
}

function makeService(chatResult: jest.Mock) {
  const chat = { _id: new ObjectId(), projectId: new ObjectId(), systemPrompt: "system" };
  const chats = {
    findByIdForWorkspace: jest.fn(async () => chat),
    serialize: jest.fn((value) => value)
  };
  const messages = {
    create: jest.fn(async (value) => ({ _id: new ObjectId(), ...value })),
    serialize: jest.fn((value) => value)
  };
  const usage = { record: jest.fn(async (value) => value) };
  const service = new ChatsService(chats as any, messages as any, {} as any, { chat: chatResult } as any, usage as any);
  return { service, messages, usage };
}

describe("ChatsService usage persistence", () => {
  it("persists chat pricing and usage source metadata", async () => {
    const result = llmResult();
    const { service, messages, usage } = makeService(jest.fn(async () => result));

    await service.addMessage(new ObjectId(), new ObjectId(), new ObjectId(), { content: "hello", providerType: "openai" });

    expect(messages.create).toHaveBeenLastCalledWith(expect.objectContaining({
      role: "assistant",
      pricingSnapshotId: result.pricingSnapshotId,
      usageSource: "exact",
      costSource: "exact",
      calculatedAt: result.calculatedAt
    }));
    expect(usage.record).toHaveBeenCalledWith(expect.objectContaining({
      source: "chat",
      pricingSnapshotId: result.pricingSnapshotId,
      usageSource: "exact",
      costSource: "exact"
    }));
  });

  it("persists successful compare usage when another model fails", async () => {
    const chat = jest.fn()
      .mockResolvedValueOnce(llmResult())
      .mockRejectedValueOnce(new Error("provider failed"));
    const { service, usage } = makeService(chat);

    const results = await service.compare(new ObjectId(), new ObjectId(), {
      prompt: "compare",
      models: [{ providerType: "openai" }, { providerType: "anthropic" }]
    });

    expect(usage.record).toHaveBeenCalledTimes(1);
    expect(results[0]).toEqual(expect.objectContaining({ content: "answer" }));
    expect(results[1]).toEqual(expect.objectContaining({ error: "provider failed" }));
  });
});
