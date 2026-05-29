export interface AgentContext {
  requirementContract: {
    originalRequirement: string;
    lockedGoal: string;
    taskType: string;
    nonNegotiables: string[];
    successCriteria: string[];
    outOfScope: string[];
    forbiddenChanges: string[];
  };
  workflowState: {
    workflowRunId: string;
    currentNodeKey: string;
    iteration: number;
    maxIterations: number;
    status: string;
  };
  budgetState: {
    maxTokens: number;
    usedTokens: number;
    remainingTokens: number;
    maxCostUsd: number;
    usedCostUsd: number;
    remainingCostUsd: number;
    mode: "normal" | "compress" | "pause" | "stop";
  };
  previousOutputs: unknown[];
  openIssues: unknown[];
  acceptedDecisions: unknown[];
  rejectedIdeas: unknown[];
  projectMemory: string[];
  instructions: {
    doNotChangeOriginalMotive: boolean;
    respondInStructuredJson: boolean;
  };
}
