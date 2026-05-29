import { Injectable } from "@nestjs/common";

@Injectable()
export class WorkflowStateMachine {
  nextAfterCritic(input: { approved: boolean; hasHighIssue: boolean; iteration: number; maxIterations: number; budgetMode: string }) {
    if (input.budgetMode === "stop") return "budget_exceeded";
    if (input.approved) return "final_output";
    if (input.hasHighIssue && input.iteration < input.maxIterations) return "issue_resolver";
    return "needs_human_review";
  }
}
