import { Injectable } from "@nestjs/common";
import { AgentContext } from "../contracts/agent-context.types";

@Injectable()
export class WorkflowContextBuilderService {
  build(input: { requirement: any; run: any; budget: any; previousOutputs: unknown[]; openIssues: unknown[]; projectMemory: string[] }): AgentContext {
    return {
      requirementContract: {
        originalRequirement: input.requirement.originalRequirement,
        lockedGoal: input.requirement.lockedGoal,
        taskType: input.requirement.taskType,
        nonNegotiables: input.requirement.nonNegotiables ?? [],
        successCriteria: input.requirement.successCriteria ?? [],
        outOfScope: input.requirement.outOfScope ?? [],
        forbiddenChanges: input.requirement.forbiddenChanges ?? []
      },
      workflowState: { workflowRunId: input.run._id.toHexString(), currentNodeKey: input.run.currentNodeKey ?? "", iteration: input.run.iteration, maxIterations: input.run.maxIterations, status: input.run.status },
      budgetState: input.budget,
      previousOutputs: input.previousOutputs,
      openIssues: input.openIssues,
      acceptedDecisions: input.run.acceptedDecisions ?? [],
      rejectedIdeas: input.run.rejectedIdeas ?? [],
      projectMemory: input.projectMemory,
      instructions: { doNotChangeOriginalMotive: true, respondInStructuredJson: true }
    };
  }
}
