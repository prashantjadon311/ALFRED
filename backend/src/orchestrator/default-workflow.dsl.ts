import { WorkflowDsl } from "../contracts/workflow-dsl.types";

export const defaultWorkflowDsl: WorkflowDsl = {
  version: "1.0",
  name: "Default Multi-Agent Product Design Loop",
  nodes: [
    { key: "requirement_lock", type: "requirement_lock", title: "Requirement Lock", config: {} },
    { key: "chatgpt_designer", type: "ai_agent", title: "ChatGPT Designer", agentRole: "product_designer", providerPreference: "openai", modelPreference: "GPT-5", promptTemplateKey: "chatgpt_designer_v1", budget: { maxTokens: 8000, maxCostUsd: 1 } },
    { key: "gemini_architect", type: "ai_agent", title: "Gemini Architect", agentRole: "software_architect", providerPreference: "gemini", promptTemplateKey: "gemini_architect_v1" },
    { key: "consensus_builder", type: "consensus", title: "Consensus Builder", promptTemplateKey: "consensus_builder_v1" },
    { key: "claude_critic", type: "critic", title: "Claude Critic", agentRole: "critic", providerPreference: "anthropic", promptTemplateKey: "claude_critic_v1" },
    { key: "issue_resolver", type: "resolver", title: "Issue Resolver", promptTemplateKey: "issue_resolver_v1" },
    { key: "final_output", type: "final_output", title: "Final Output Generator", promptTemplateKey: "final_output_v1" },
    { key: "codex_prompt_generator", type: "codex_prompt_generator", title: "Codex Prompt Generator", promptTemplateKey: "codex_prompt_generator_v1" }
  ],
  edges: [
    { key: "e1", from: "requirement_lock", to: "chatgpt_designer" },
    { key: "e2", from: "chatgpt_designer", to: "gemini_architect" },
    { key: "e3", from: "gemini_architect", to: "consensus_builder" },
    { key: "e4", from: "consensus_builder", to: "claude_critic" },
    { key: "e5", from: "claude_critic", to: "issue_resolver", condition: { type: "has_issue_severity", severityIn: ["BLOCKER", "HIGH"] } },
    { key: "e6", from: "issue_resolver", to: "chatgpt_designer", condition: { type: "iteration_remaining" } },
    { key: "e7", from: "claude_critic", to: "final_output", condition: { type: "critic_approved" } },
    { key: "e8", from: "final_output", to: "codex_prompt_generator", condition: { type: "task_type_in", values: ["software", "mixed"] } }
  ],
  stopConditions: { maxIterations: 3, stopOnBudgetExceeded: true, stopOnRequirementDrift: true, stopOnUserStop: true }
};
