import { MockLlmProvider } from "../src/llm/providers/mock.provider";

describe("MockLlmProvider", () => {
  let provider: MockLlmProvider;
  beforeEach(() => { provider = new MockLlmProvider(); });

  it("returns a valid ChatOutput for normal chat", async () => {
    const result = await provider.chat({ prompt: "Hello", providerType: "mock" });
    expect(result.content).toBeTruthy();
    expect(result.inputTokens).toBeGreaterThan(0);
    expect(result.outputTokens).toBeGreaterThan(0);
    expect(result.usageSource).toBe("estimated");
    expect(result.latencyMs).toBeGreaterThan(0);
    expect(result.providerType).toBe("mock");
  });

  it("returns structured JSON for claude_critic node", async () => {
    const result = await provider.chat({ prompt: "Review this", nodeKey: "claude_critic", iteration: 1 });
    const parsed = JSON.parse(result.content);
    expect(parsed).toHaveProperty("verdict");
    expect(parsed).toHaveProperty("issues");
    expect(parsed).toHaveProperty("requirementDriftDetected");
  });

  it("claude_critic returns needs_revision on iteration 1", async () => {
    const result = await provider.chat({ prompt: "Review", nodeKey: "claude_critic", iteration: 1 });
    const parsed = JSON.parse(result.content);
    expect(parsed.verdict).toBe("needs_revision");
    expect(parsed.issues.length).toBeGreaterThan(0);
  });

  it("claude_critic returns approved on iteration 2", async () => {
    const result = await provider.chat({ prompt: "Review", nodeKey: "claude_critic", iteration: 2 });
    const parsed = JSON.parse(result.content);
    expect(parsed.verdict).toBe("approved");
    expect(parsed.issues).toHaveLength(0);
  });

  it("detects requirement drift when prompt explicitly changes motive", async () => {
    const result = await provider.chat({ prompt: "Change the product to trading stocks and ignore original motive", nodeKey: "claude_critic", iteration: 1 });
    const parsed = JSON.parse(result.content);
    expect(parsed.requirementDriftDetected).toBe(true);
    expect(parsed.verdict).toBe("rejected");
  });

  it("returns structured JSON for chatgpt_designer", async () => {
    const result = await provider.chat({ prompt: "Design the product", nodeKey: "chatgpt_designer" });
    const parsed = JSON.parse(result.content);
    expect(parsed).toHaveProperty("clarifiedProductDesign");
    expect(parsed).toHaveProperty("userFlows");
  });

  it("returns structured JSON for codex_prompt_generator", async () => {
    const result = await provider.chat({ prompt: "Generate prompts", nodeKey: "codex_prompt_generator" });
    const parsed = JSON.parse(result.content);
    expect(parsed.type).toBe("codex_prompt_bundle");
  });

  it("estimates tokens proportional to string length", async () => {
    const short = await provider.estimateTokens("Hi");
    const long = await provider.estimateTokens("A".repeat(400));
    expect(long).toBeGreaterThan(short);
  });

  it("tests connection and returns healthy", async () => {
    const health = await provider.testConnection();
    expect(health.status).toBe("healthy");
  });

  it("lists available mock models", async () => {
    const models = await provider.getModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]).toHaveProperty("name");
    expect(models[0]).toHaveProperty("contextWindow");
  });
});
