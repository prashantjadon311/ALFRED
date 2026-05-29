export type WorkflowNodeType =
  | "input" | "requirement_lock" | "ai_agent" | "consensus" | "critic" | "resolver" | "budget_gate" | "human_approval"
  | "final_output" | "codex_prompt_generator" | "export";

export type WorkflowConditionType = "has_issue_severity" | "iteration_remaining" | "critic_approved" | "task_type_in";

export interface WorkflowDslNode {
  key: string;
  type: WorkflowNodeType;
  title: string;
  agentRole?: string;
  providerPreference?: string;
  modelPreference?: string;
  promptTemplateKey?: string;
  budget?: { maxTokens?: number; maxCostUsd?: number };
  config?: Record<string, unknown>;
}

export interface WorkflowDslEdge {
  key: string;
  from: string;
  to: string;
  condition?: {
    type: WorkflowConditionType;
    severityIn?: Array<"BLOCKER" | "HIGH" | "MEDIUM" | "LOW">;
    values?: string[];
  };
}

export interface WorkflowDsl {
  version: "1.0";
  name: string;
  nodes: WorkflowDslNode[];
  edges: WorkflowDslEdge[];
  stopConditions: {
    maxIterations: number;
    stopOnBudgetExceeded: boolean;
    stopOnRequirementDrift: boolean;
    stopOnUserStop: boolean;
  };
}
