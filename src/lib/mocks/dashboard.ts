import type { ModelProvider } from "@/lib/types";
import { providerCosts } from "./usage";
import { agentNodes, workflows } from "./workflows";

export { agentNodes, providerCosts, workflows };

export const providers: ModelProvider[] = [
  { id: "openai", name: "OpenAI", enabled: true, maskedApiKey: "sk-proj-••••••••••••••••8F3a", baseUrl: "https://api.openai.com/v1", defaultModel: "GPT-5", health: "Healthy", inputCost: 5, outputCost: 15, rateLimit: "12k rpm / 4M tpm" },
  { id: "gemini", name: "Google Gemini", enabled: true, maskedApiKey: "AIza••••••••••••••••u92K", baseUrl: "https://generativelanguage.googleapis.com", defaultModel: "Gemini 2.5 Pro", health: "Healthy", inputCost: 3.5, outputCost: 10.5, rateLimit: "8k rpm / 2M tpm" },
  { id: "claude", name: "Anthropic Claude", enabled: true, maskedApiKey: "sk-ant-••••••••••••••••72Qp", baseUrl: "https://api.anthropic.com", defaultModel: "Claude Opus", health: "Degraded", inputCost: 15, outputCost: 75, rateLimit: "3k rpm / 1M tpm" },
  { id: "ollama", name: "Local LLM/Ollama", enabled: true, maskedApiKey: "local-only", baseUrl: "http://localhost:11434", defaultModel: "llama3.1:70b", health: "Healthy", inputCost: 0, outputCost: 0, rateLimit: "local hardware" }
];

export const activityTimeline = [
  { id: "act-001", title: "Gemini Architect started structural review", time: "2m ago", type: "agent" },
  { id: "act-002", title: "Requirement Contract locked for A.L.F.R.E.D. Platform", time: "18m ago", type: "lock" },
  { id: "act-003", title: "Claude Critic flagged graph density risk", time: "37m ago", type: "critique" },
  { id: "act-004", title: "Provider budget alert reached 80%", time: "1h ago", type: "budget" },
  { id: "act-005", title: "Codex Prompt Generator exported patch prompt", time: "2h ago", type: "artifact" }
];
