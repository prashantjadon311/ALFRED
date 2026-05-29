export const llmConfig = () => ({
  mockMode: (process.env.LLM_MOCK_MODE ?? "true") === "true",
  openAiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"
});
