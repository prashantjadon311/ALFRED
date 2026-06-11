import { AnthropicProvider } from "../src/llm/providers/anthropic.provider";
import { GeminiProvider } from "../src/llm/providers/gemini.provider";
import { OpenAiProvider } from "../src/llm/providers/openai.provider";

const encryption = { decrypt: jest.fn(() => "test-key") } as any;

function response(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as Response;
}

describe("provider usage normalization", () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("parses exact OpenAI usage details", async () => {
    fetchMock.mockResolvedValue(response({
      model: "gpt-test",
      choices: [{ message: { content: "done" } }],
      usage: {
        prompt_tokens: 120,
        completion_tokens: 40,
        prompt_tokens_details: { cached_tokens: 20 },
        completion_tokens_details: { reasoning_tokens: 10 }
      }
    }));

    const result = await new OpenAiProvider(encryption).chat({ prompt: "hello", encryptedApiKey: "encrypted" });

    expect(result).toMatchObject({
      inputTokens: 120,
      outputTokens: 40,
      cachedInputTokens: 20,
      reasoningTokens: 10,
      usageSource: "exact"
    });
  });

  it("parses exact Anthropic usage including cached input", async () => {
    fetchMock.mockResolvedValue(response({
      model: "claude-test",
      content: [{ type: "text", text: "done" }],
      usage: {
        input_tokens: 100,
        cache_creation_input_tokens: 20,
        cache_read_input_tokens: 30,
        output_tokens: 40
      }
    }));

    const result = await new AnthropicProvider(encryption).chat({ prompt: "hello", encryptedApiKey: "encrypted" });

    expect(result).toMatchObject({
      inputTokens: 150,
      outputTokens: 40,
      cacheWriteInputTokens: 20,
      cachedInputTokens: 30,
      usageSource: "exact"
    });
  });

  it("parses exact Gemini usage including thinking tokens", async () => {
    fetchMock.mockResolvedValue(response({
      candidates: [{ content: { parts: [{ text: "done" }] } }],
      usageMetadata: {
        promptTokenCount: 50,
        cachedContentTokenCount: 8,
        candidatesTokenCount: 10,
        thoughtsTokenCount: 3
      }
    }));

    const result = await new GeminiProvider(encryption).chat({ prompt: "hello", encryptedApiKey: "encrypted" });

    expect(result).toMatchObject({
      inputTokens: 50,
      outputTokens: 13,
      cachedInputTokens: 8,
      reasoningTokens: 3,
      usageSource: "exact"
    });
  });

  it("marks token estimates when provider usage is unavailable", async () => {
    fetchMock.mockResolvedValue(response({
      model: "gpt-test",
      choices: [{ message: { content: "estimated output" } }]
    }));

    const result = await new OpenAiProvider(encryption).chat({ prompt: "estimated input", encryptedApiKey: "encrypted" });

    expect(result.inputTokens).toBeGreaterThan(0);
    expect(result.outputTokens).toBeGreaterThan(0);
    expect(result.usageSource).toBe("estimated");
  });
});
