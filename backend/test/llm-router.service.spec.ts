import { ConfigService } from "@nestjs/config";
import { ObjectId } from "mongodb";
import { LlmRouterService } from "../src/llm/llm-router.service";
import { AnthropicProvider } from "../src/llm/providers/anthropic.provider";
import { CustomOpenAiCompatibleProvider } from "../src/llm/providers/custom-openai.provider";
import { GeminiProvider } from "../src/llm/providers/gemini.provider";
import { MockLlmProvider } from "../src/llm/providers/mock.provider";
import { OllamaProvider } from "../src/llm/providers/ollama.provider";
import { OpenAiProvider } from "../src/llm/providers/openai.provider";
import { ModelProvidersService } from "../src/modules/model-providers/model-providers.service";
import { EncryptionService } from "../src/security/encryption.service";

const rawApiKey = "sk-test-raw-secret-that-must-not-leak";

function makeEncryption() {
  const config = { get: (key: string) => key === "ENCRYPTION_KEY" ? "test-key-32-bytes-for-unit-tests!" : undefined } as any as ConfigService;
  return new EncryptionService(config);
}

function fetchResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

function makeProviders(encryption = makeEncryption()) {
  return {
    mock: new MockLlmProvider(),
    openai: new OpenAiProvider(encryption),
    anthropic: new AnthropicProvider(encryption),
    gemini: new GeminiProvider(encryption),
    ollama: new OllamaProvider(),
    customOpenai: new CustomOpenAiCompatibleProvider(encryption)
  };
}

function makeRouter(options: { providerDoc?: any; modelDoc?: any } = {}) {
  const providers = makeProviders();
  const modelProviders = {
    resolveForLlm: jest.fn(async () => options.providerDoc ?? null)
  };
  const aiModels = {
    findByName: jest.fn(async () => options.modelDoc ?? null)
  };
  return new LlmRouterService(
    providers.mock,
    providers.openai,
    providers.anthropic,
    providers.gemini,
    providers.ollama,
    providers.customOpenai,
    modelProviders as any,
    aiModels as any
  );
}

describe("LlmRouterService provider routing", () => {
  const originalMockMode = process.env.LLM_MOCK_MODE;
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    process.env.LLM_MOCK_MODE = originalMockMode;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("uses mock provider whenever mock mode is enabled", async () => {
    process.env.LLM_MOCK_MODE = "true";
    const router = makeRouter();

    const result = await router.chat({ prompt: "hello", providerType: "openai", userId: new ObjectId().toHexString() });

    expect(result.providerType).toBe("mock");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("selects OpenAI when mock mode is disabled", async () => {
    process.env.LLM_MOCK_MODE = "false";
    const encryption = makeEncryption();
    fetchMock.mockResolvedValue(fetchResponse({
      id: "chatcmpl-test",
      model: "gpt-test",
      choices: [{ message: { content: "real openai response" } }],
      usage: { prompt_tokens: 4, completion_tokens: 5 }
    }));
    const router = makeRouter({
      providerDoc: { providerType: "openai", encryptedApiKey: encryption.encrypt(rawApiKey), baseUrl: "https://api.openai.test/v1" }
    });

    const result = await router.chat({ prompt: "hello", providerType: "openai", modelName: "gpt-test", userId: new ObjectId().toHexString() });

    expect(result.providerType).toBe("openai");
    expect(result.content).toBe("real openai response");
    expect(fetchMock).toHaveBeenCalledWith("https://api.openai.test/v1/chat/completions", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: `Bearer ${rawApiKey}` })
    }));
  });

  it("throws a clean error when a remote API key is missing", async () => {
    process.env.LLM_MOCK_MODE = "false";
    const router = makeRouter({ providerDoc: { providerType: "openai" } });

    await expect(router.chat({ prompt: "hello", providerType: "openai", userId: new ObjectId().toHexString() })).rejects.toThrow("API key missing for openai provider");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("supports custom OpenAI-compatible base URLs", async () => {
    process.env.LLM_MOCK_MODE = "false";
    const encryption = makeEncryption();
    fetchMock.mockResolvedValue(fetchResponse({
      model: "router-model",
      choices: [{ message: { content: "custom response" } }]
    }));
    const router = makeRouter({
      providerDoc: { providerType: "custom_openai_compatible", encryptedApiKey: encryption.encrypt(rawApiKey), baseUrl: "https://router.example/v1" }
    });

    await router.chat({ prompt: "hello", providerType: "custom_openai_compatible", modelName: "router-model", userId: new ObjectId().toHexString() });

    expect(fetchMock).toHaveBeenCalledWith("https://router.example/v1/chat/completions", expect.any(Object));
  });
});

describe("ModelProvidersService provider testing", () => {
  const originalMockMode = process.env.LLM_MOCK_MODE;
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    process.env.LLM_MOCK_MODE = originalMockMode;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function makeService(doc: any, encryption = makeEncryption()) {
    const providers = makeProviders(encryption);
    const repo = {
      findById: jest.fn(async () => doc),
      updateById: jest.fn(async (_id, _userId, patch) => ({ ...doc, ...patch })),
      collection: jest.fn()
    };
    const audit = { audit: jest.fn() };
    const service = new ModelProvidersService(
      repo as any,
      audit as any,
      encryption,
      providers.mock,
      providers.openai,
      providers.anthropic,
      providers.gemini,
      providers.ollama,
      providers.customOpenai
    );
    return { service, repo };
  }

  it("tests real providers without exposing secrets", async () => {
    process.env.LLM_MOCK_MODE = "false";
    const encryption = makeEncryption();
    const encryptedApiKey = encryption.encrypt(rawApiKey);
    const { service } = makeService({ _id: new ObjectId(), providerType: "openai", encryptedApiKey, baseUrl: "https://api.openai.test/v1", config: { defaultModel: "gpt-test" } }, encryption);
    fetchMock.mockResolvedValue(fetchResponse({ choices: [{ message: { content: "ok" } }], usage: { prompt_tokens: 1, completion_tokens: 1 } }));

    const health = await service.test(new ObjectId(), new ObjectId());

    expect(health.status).toBe("healthy");
    expect(JSON.stringify(health)).not.toContain(rawApiKey);
  });

  it("does not leak raw API keys in provider test failures", async () => {
    process.env.LLM_MOCK_MODE = "false";
    const encryption = makeEncryption();
    const encryptedApiKey = encryption.encrypt(rawApiKey);
    const { service } = makeService({ _id: new ObjectId(), providerType: "openai", encryptedApiKey, baseUrl: "https://api.openai.test/v1", config: {} }, encryption);
    fetchMock.mockResolvedValue(fetchResponse({ error: { message: `bad key ${rawApiKey}` } }, false, 401));

    const health = await service.test(new ObjectId(), new ObjectId());

    expect(health.status).toBe("offline");
    expect(health.message).toBe("openai provider request failed with status 401");
    expect(JSON.stringify(health)).not.toContain(rawApiKey);
  });
});
