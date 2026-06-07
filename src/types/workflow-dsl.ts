export const WORKFLOW_NODE_TYPES = [
  "input",
  "requirement_lock",
  "ai_agent",
  "consensus",
  "critic",
  "resolver",
  "budget_gate",
  "human_approval",
  "final_output",
  "codex_prompt_generator",
  "export"
] as const;

export const WORKFLOW_CONDITION_TYPES = [
  "has_issue_severity",
  "iteration_remaining",
  "critic_approved",
  "task_type_in"
] as const;

export type WorkflowNodeType = (typeof WORKFLOW_NODE_TYPES)[number];
export type WorkflowConditionType = (typeof WORKFLOW_CONDITION_TYPES)[number];
export type WorkflowSeverity = "BLOCKER" | "HIGH" | "MEDIUM" | "LOW";

export type WorkflowPosition = {
  x: number;
  y: number;
};

export interface WorkflowNodeConfig {
  inlineSystemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  retryCount?: number;
  approvalRequired?: boolean;
  approvalMessage?: string;
  ui?: {
    position?: WorkflowPosition;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface WorkflowNode {
  key: string;
  type: WorkflowNodeType;
  title: string;
  agentRole?: string;
  providerPreference?: string;
  modelPreference?: string;
  promptTemplateKey?: string;
  budget?: {
    maxTokens?: number;
    maxCostUsd?: number;
  };
  config?: WorkflowNodeConfig;
}

export interface WorkflowEdgeCondition {
  type: WorkflowConditionType;
  severityIn?: WorkflowSeverity[];
  values?: string[];
}

export interface WorkflowEdge {
  key: string;
  from: string;
  to: string;
  condition?: WorkflowEdgeCondition;
}

export interface WorkflowDsl {
  version: "1.0";
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  stopConditions: {
    maxIterations: number;
    stopOnBudgetExceeded: boolean;
    stopOnRequirementDrift: boolean;
    stopOnUserStop: boolean;
  };
}
