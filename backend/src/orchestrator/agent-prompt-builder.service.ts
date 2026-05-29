import { Injectable } from "@nestjs/common";
import { AgentContext } from "../contracts/agent-context.types";

@Injectable()
export class AgentPromptBuilderService {
  build(nodeKey: string, context: AgentContext) {
    const compressed = context.budgetState.mode === "compress" ? "Use compressed reasoning and only include essential details." : "";
    return [
      `You are ${nodeKey} in A.L.F.R.E.D., an agentic AI orchestration backend.`,
      "Never change the original user motive. Never request or expose secrets.",
      compressed,
      `Requirement: ${context.requirementContract.lockedGoal}`,
      `Non-negotiables: ${context.requirementContract.nonNegotiables.join("; ")}`,
      `Open issues: ${JSON.stringify(context.openIssues)}`,
      "Return structured JSON when requested."
    ].filter(Boolean).join("\n");
  }
}
