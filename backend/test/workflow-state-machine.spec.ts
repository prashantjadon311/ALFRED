import { WorkflowStateMachine } from "../src/orchestrator/workflow-state-machine";
import { CritiqueResolutionService } from "../src/orchestrator/critique-resolution.service";

describe("WorkflowStateMachine", () => {
  let machine: WorkflowStateMachine;
  beforeEach(() => { machine = new WorkflowStateMachine(); });

  it("returns final_output when critic approved and no issues", () => {
    const next = machine.nextAfterCritic({ approved: true, hasHighIssue: false, iteration: 1, maxIterations: 3, budgetMode: "normal" });
    expect(next).toBe("final_output");
  });

  it("returns issue_resolver when there are HIGH issues and iterations remain", () => {
    const next = machine.nextAfterCritic({ approved: false, hasHighIssue: true, iteration: 1, maxIterations: 3, budgetMode: "normal" });
    expect(next).toBe("issue_resolver");
  });

  it("returns needs_human_review when max iterations reached", () => {
    const next = machine.nextAfterCritic({ approved: false, hasHighIssue: true, iteration: 3, maxIterations: 3, budgetMode: "normal" });
    expect(next).toBe("needs_human_review");
  });

  it("returns budget_exceeded when budget mode is stop", () => {
    const next = machine.nextAfterCritic({ approved: true, hasHighIssue: false, iteration: 1, maxIterations: 3, budgetMode: "stop" });
    expect(next).toBe("budget_exceeded");
  });
});

describe("CritiqueResolutionService", () => {
  let service: CritiqueResolutionService;
  beforeEach(() => { service = new CritiqueResolutionService(); });

  it("returns true when BLOCKER issues exist", () => {
    expect(service.hasBlockingIssues([{ severity: "BLOCKER" }, { severity: "LOW" }])).toBe(true);
  });

  it("returns true when HIGH issues exist", () => {
    expect(service.hasBlockingIssues([{ severity: "HIGH" }])).toBe(true);
  });

  it("returns false when only LOW/MEDIUM issues exist", () => {
    expect(service.hasBlockingIssues([{ severity: "MEDIUM" }, { severity: "LOW" }])).toBe(false);
  });

  it("returns false for empty issues array", () => {
    expect(service.hasBlockingIssues([])).toBe(false);
  });
});
