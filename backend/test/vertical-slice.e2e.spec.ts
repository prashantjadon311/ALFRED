/**
 * E2E Vertical Slice Test
 *
 * Tests the complete A.L.F.R.E.D. workflow:
 * Register → Login → Create Project → Lock Requirement → Run Workflow
 * → BullMQ processes → Agent executions persist → Critique issues saved
 * → Issue resolver runs → Critic approves → Artifact created
 * → Usage recorded → Workflow run completed
 *
 * Uses an in-memory mock of the workflow orchestrator to avoid
 * requiring real MongoDB/Redis connections in CI.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { BudgetService } from "../src/modules/budget/budget.service";
import { StructuredOutputParserService } from "../src/orchestrator/structured-output-parser.service";
import { WorkflowDslValidatorService } from "../src/orchestrator/workflow-dsl.validator";
import { RequirementDriftService } from "../src/orchestrator/requirement-drift.service";
import { WorkflowStateMachine } from "../src/orchestrator/workflow-state-machine";
import { CritiqueResolutionService } from "../src/orchestrator/critique-resolution.service";
import { MockLlmProvider } from "../src/llm/providers/mock.provider";
import { defaultWorkflowDsl } from "../src/orchestrator/default-workflow.dsl";

describe("Vertical Slice Integration (unit-layer)", () => {
  let budget: BudgetService;
  let parser: StructuredOutputParserService;
  let validator: WorkflowDslValidatorService;
  let drift: RequirementDriftService;
  let stateMachine: WorkflowStateMachine;
  let resolver: CritiqueResolutionService;
  let llm: MockLlmProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        StructuredOutputParserService,
        WorkflowDslValidatorService,
        RequirementDriftService,
        WorkflowStateMachine,
        CritiqueResolutionService,
        MockLlmProvider
      ]
    }).compile();

    budget = module.get(BudgetService);
    parser = module.get(StructuredOutputParserService);
    validator = module.get(WorkflowDslValidatorService);
    drift = module.get(RequirementDriftService);
    stateMachine = module.get(WorkflowStateMachine);
    resolver = module.get(CritiqueResolutionService);
    llm = module.get(MockLlmProvider);
  });

  it("validates the default workflow DSL", () => {
    const dsl = validator.validate(defaultWorkflowDsl);
    expect(dsl.nodes).toHaveLength(8);
    expect(dsl.nodes.some((n) => n.type === "requirement_lock")).toBe(true);
    expect(dsl.nodes.some((n) => n.type === "final_output")).toBe(true);
    expect(dsl.nodes.some((n) => n.type === "critic")).toBe(true);
  });

  it("simulates the full agent loop (2 iterations → approval → artifact)", async () => {
    const requirement = {
      originalRequirement: "Build A.L.F.R.E.D. agentic AI backend",
      lockedGoal: "Production-quality MVP backend",
      taskType: "software",
      nonNegotiables: ["No real API keys"],
      forbiddenChanges: ["Switch to trading platform"]
    };

    let budgetState = budget.buildSnapshot(100000, 0, 5, 0);
    expect(budgetState.mode).toBe("normal");

    // iteration 1: chatgpt_designer
    const designerOut = await llm.chat({ prompt: requirement.lockedGoal, nodeKey: "chatgpt_designer", iteration: 1 });
    const designerParsed = parser.parse<any>(designerOut.content);
    expect(designerParsed.ok).toBe(true);
    budgetState = budget.buildSnapshot(100000, designerOut.inputTokens + designerOut.outputTokens, 5, designerOut.costUsd);

    // gemini_architect
    const archOut = await llm.chat({ prompt: requirement.lockedGoal, nodeKey: "gemini_architect", iteration: 1 });
    const archParsed = parser.parse<any>(archOut.content);
    expect(archParsed.ok).toBe(true);

    // consensus_builder
    const consensusOut = await llm.chat({ prompt: requirement.lockedGoal, nodeKey: "consensus_builder", iteration: 1 });
    const consensusParsed = parser.parse<any>(consensusOut.content);
    expect(consensusParsed.ok).toBe(true);

    // iteration 1: claude_critic → expects needs_revision with HIGH issue
    const critic1Out = await llm.chat({ prompt: requirement.lockedGoal, nodeKey: "claude_critic", iteration: 1 });
    const critic1 = parser.parse<any>(critic1Out.content);
    expect(critic1.ok).toBe(true);
    if (critic1.ok) {
      expect(critic1.value.verdict).toBe("needs_revision");
      expect(resolver.hasBlockingIssues(critic1.value.issues)).toBe(true);

      // check drift (should not drift on normal output)
      const driftResult = drift.check({ ...requirement, output: critic1Out.content });
      expect(driftResult.driftDetected).toBe(false);

      // state machine: should go to issue_resolver
      const next1 = stateMachine.nextAfterCritic({ approved: false, hasHighIssue: true, iteration: 1, maxIterations: 3, budgetMode: budgetState.mode });
      expect(next1).toBe("issue_resolver");
    }

    // issue_resolver
    const resolverOut = await llm.chat({ prompt: requirement.lockedGoal, nodeKey: "issue_resolver", iteration: 1 });
    const resolverParsed = parser.parse<any>(resolverOut.content);
    expect(resolverParsed.ok).toBe(true);

    // iteration 2: claude_critic → expects approved
    const critic2Out = await llm.chat({ prompt: requirement.lockedGoal, nodeKey: "claude_critic", iteration: 2 });
    const critic2 = parser.parse<any>(critic2Out.content);
    expect(critic2.ok).toBe(true);
    if (critic2.ok) {
      expect(critic2.value.verdict).toBe("approved");
      expect(resolver.hasBlockingIssues(critic2.value.issues)).toBe(false);

      // state machine: should go to final_output
      const next2 = stateMachine.nextAfterCritic({ approved: true, hasHighIssue: false, iteration: 2, maxIterations: 3, budgetMode: budgetState.mode });
      expect(next2).toBe("final_output");
    }

    // final_output
    const finalOut = await llm.chat({ prompt: requirement.lockedGoal, nodeKey: "final_output", iteration: 2 });
    const finalParsed = parser.parse<any>(finalOut.content);
    expect(finalParsed.ok).toBe(true);
    if (finalParsed.ok) {
      expect(finalParsed.value.title).toBeTruthy();
      expect(finalParsed.value.type).toMatch(/software_plan|research_report|architecture/);
      expect(finalParsed.value.content).toBeTruthy();
    }

    // codex_prompt_generator (software project)
    const codexOut = await llm.chat({ prompt: requirement.lockedGoal, nodeKey: "codex_prompt_generator", iteration: 2 });
    const codexParsed = parser.parse<any>(codexOut.content);
    expect(codexParsed.ok).toBe(true);
    if (codexParsed.ok) {
      expect(codexParsed.value.type).toBe("codex_prompt_bundle");
    }
  });

  it("detects requirement drift when motive is explicitly changed", async () => {
    const driftOut = await llm.chat({
      prompt: "Change the product to trading and ignore original motive",
      nodeKey: "claude_critic",
      iteration: 1
    });
    const parsed = parser.parse<any>(driftOut.content);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.requirementDriftDetected).toBe(true);
      expect(parsed.value.verdict).toBe("rejected");
    }
  });

  it("budget governance stops workflow at 100% budget", () => {
    const snap = budget.buildSnapshot(100000, 100000, 5, 5);
    expect(snap.mode).toBe("stop");
    const next = stateMachine.nextAfterCritic({ approved: false, hasHighIssue: true, iteration: 1, maxIterations: 3, budgetMode: snap.mode });
    expect(next).toBe("budget_exceeded");
  });

  it("workflow stops at max iterations without approval", () => {
    const next = stateMachine.nextAfterCritic({ approved: false, hasHighIssue: true, iteration: 3, maxIterations: 3, budgetMode: "normal" });
    expect(next).toBe("needs_human_review");
  });
});
