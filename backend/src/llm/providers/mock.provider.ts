import { Injectable } from "@nestjs/common";
import { LlmProvider } from "../interfaces/llm-provider.interface";
import { ChatInput, ChatOutput } from "../interfaces/llm.types";

@Injectable()
export class MockLlmProvider implements LlmProvider {
  providerType: LlmProvider["providerType"] = "mock";

  async chat(input: ChatInput): Promise<ChatOutput> {
    const started = Date.now();
    const content = this.mockContent(input);
    const inputTokens = await this.estimateTokens(`${input.systemPrompt ?? ""}\n${input.prompt}`);
    const outputTokens = await this.estimateTokens(content);
    return {
      content,
      providerType: input.providerType ?? "mock",
      modelName: input.modelName ?? this.modelForNode(input.nodeKey),
      inputTokens,
      outputTokens,
      costUsd: Number(((inputTokens * 0.000002) + (outputTokens * 0.000006)).toFixed(6)),
      latencyMs: Date.now() - started + 120
    };
  }

  async estimateTokens(input: string) {
    return Math.max(1, Math.ceil(input.length / 4));
  }

  async getModels() {
    return [
      { name: "Mock GPT-5", contextWindow: 400000 },
      { name: "Mock Claude Opus", contextWindow: 200000 },
      { name: "Mock Gemini", contextWindow: 1000000 },
      { name: "Mock Local", contextWindow: 128000 }
    ];
  }

  async testConnection() {
    return { status: "healthy" as const, message: "Mock provider ready" };
  }

  private modelForNode(nodeKey?: string) {
    if (nodeKey?.includes("claude")) return "Mock Claude Opus";
    if (nodeKey?.includes("gemini")) return "Mock Gemini";
    if (nodeKey?.includes("codex")) return "Mock GPT-5 Codex";
    return "Mock GPT-5";
  }

  private mockContent(input: ChatInput) {
    const node = input.nodeKey ?? "chat";
    const prompt = input.prompt.toLowerCase();
    if (prompt.includes("ignore original") || prompt.includes("change the product to trading")) {
      return JSON.stringify({ verdict: "rejected", summary: "Requirement drift detected.", issues: [{ title: "Original motive changed", severity: "BLOCKER", affectedArea: "Requirement contract", recommendation: "Restore the locked A.L.F.R.E.D. motive." }], requirementDriftDetected: true, driftReason: "Prompt asks to replace the agentic AI platform motive.", confidence: 0.96 });
    }
    if (node.includes("chatgpt_designer")) {
      return JSON.stringify({ clarifiedProductDesign: "A.L.F.R.E.D. should remain a command center for agentic workflow execution.", userFlows: ["lock requirement", "run model loop", "review Claude issues", "export artifact"], moduleBreakdown: ["projects", "playground", "workflow runs", "governance"], assumptions: ["mock mode enabled"], risks: ["workflow drift", "budget overrun"] });
    }
    if (node.includes("gemini_architect")) {
      return JSON.stringify({ architecture: "NestJS modules isolate auth, workspace, LLM gateway, workflow orchestration, realtime, and governance.", components: ["Mongo repositories", "BullMQ worker", "SSE event bus", "mock LLM router"], dataModelSuggestions: ["append-only workflow_events", "separate messages", "usage_events"], integrationPoints: ["frontend graph state", "future real provider adapters"], technicalRisks: ["idempotency", "budget enforcement"] });
    }
    if (node.includes("consensus")) {
      return JSON.stringify({ summary: "Use a requirement-locked, budget-aware multi-agent workflow.", architecture: "Mock LLM router drives agents through BullMQ, persisting events for live graph reconstruction.", decisions: [{ decision: "Workflow events are source of truth for live UI", reason: "Keeps graph replayable and auditable" }], risks: ["Real providers need adapter hardening"], openQuestions: [], assumptions: ["NestJS backend owns orchestration"] });
    }
    if (node.includes("claude_critic")) {
      const iteration = input.iteration ?? 1;
      if (iteration <= 1) {
        return JSON.stringify({ verdict: "needs_revision", summary: "Core flow is valid, but budget stop handling must be made explicit.", issues: [{ title: "Budget stop condition underspecified", severity: "HIGH", affectedArea: "Workflow governance", recommendation: "Add a budget gate before final artifact generation." }], requirementDriftDetected: false, driftReason: "", confidence: 0.88 });
      }
      return JSON.stringify({ verdict: "approved", summary: "Issue resolver added explicit governance checks. Approved.", issues: [], requirementDriftDetected: false, driftReason: "", confidence: 0.93 });
    }
    if (node.includes("issue_resolver")) {
      return JSON.stringify({ patchSummary: "Added explicit budget gate and stop condition before final output.", fixedIssues: [{ issueTitle: "Budget stop condition underspecified", fix: "Budget check now runs before final artifact generation." }], revisedOutput: "The workflow pauses or stops when budget mode becomes pause or stop.", remainingRisks: [] });
    }
    if (node.includes("codex_prompt")) {
      return JSON.stringify({ title: "A.L.F.R.E.D. Codex Prompt Bundle", type: "codex_prompt_bundle", content: "## Phase 1\nBuild auth, projects, requirement contracts.\n\n## Phase 2\nImplement BullMQ workflow engine.\n\n## Phase 3\nAdd SSE graph replay and governance tests.\n\nAcceptance: no raw keys, all events persisted.", metadata: { generatedBy: "mock-codex" } });
    }
    if (node.includes("final_output")) {
      return JSON.stringify({ title: "A.L.F.R.E.D. Reviewed Execution Plan", type: "software_plan", content: "## Final Plan\nA requirement-locked, budget-aware agentic orchestration backend with mock LLM execution, Claude critique, issue resolution, artifacts, and SSE graph replay.", metadata: { approvedByCritic: true } });
    }
    return `Mock assistant response for A.L.F.R.E.D. in ${input.modelName ?? "Mock GPT-5"} mode. The request stays frontend-safe, requirement-locked, and budget-aware.`;
  }
}
