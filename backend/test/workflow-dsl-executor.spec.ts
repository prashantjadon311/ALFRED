import { WorkflowDsl } from "../src/contracts/workflow-dsl.types";
import { defaultWorkflowDsl } from "../src/orchestrator/default-workflow.dsl";
import {
  evaluateEdgeCondition,
  findStartNode,
  getNode,
  getOutgoingEdges,
  selectNextEdge,
  shouldRequestHumanReviewForMaxIteration,
  WorkflowTraversalState
} from "../src/orchestrator/workflow-orchestrator.service";

function state(patch: Partial<WorkflowTraversalState> = {}): WorkflowTraversalState {
  return {
    iteration: 1,
    maxIterations: 3,
    previousOutputs: [],
    lastCriticIssues: [],
    openBlockingIssues: [],
    openIssueDocs: [],
    taskType: "software",
    completed: false,
    finalArtifactCreated: false,
    ...patch
  };
}

function walkDefaultDsl() {
  const visited: string[] = [];
  const traversal = state();
  let node = findStartNode(defaultWorkflowDsl);
  for (let guard = 0; node && guard < 20; guard += 1) {
    visited.push(node.key);
    if (node.key === "claude_critic" && traversal.iteration === 1) {
      traversal.lastCriticOutput = { verdict: "needs_revision" };
      traversal.lastCriticIssues = [{ severity: "HIGH" }];
      traversal.openBlockingIssues = [{ severity: "HIGH" }];
    } else if (node.key === "claude_critic") {
      traversal.lastCriticOutput = { verdict: "approved" };
      traversal.lastCriticIssues = [];
      traversal.openBlockingIssues = [];
    }

    const edge = selectNextEdge(defaultWorkflowDsl, node.key, traversal);
    if (!edge) break;
    if (node.key === "issue_resolver" && edge.condition?.type === "iteration_remaining") {
      traversal.iteration += 1;
      traversal.openBlockingIssues = [];
    }
    node = getNode(defaultWorkflowDsl, edge.to);
  }
  return visited;
}

describe("Workflow DSL traversal helpers", () => {
  it("finds the default requirement_lock start node", () => {
    expect(findStartNode(defaultWorkflowDsl)?.key).toBe("requirement_lock");
  });

  it("default workflow follows the existing revision loop and completion path", () => {
    expect(walkDefaultDsl()).toEqual([
      "requirement_lock",
      "chatgpt_designer",
      "gemini_architect",
      "consensus_builder",
      "claude_critic",
      "issue_resolver",
      "chatgpt_designer",
      "gemini_architect",
      "consensus_builder",
      "claude_critic",
      "final_output",
      "codex_prompt_generator"
    ]);
  });

  it("custom minimal DSL executes nodes in edge order", () => {
    const dsl: WorkflowDsl = {
      ...defaultWorkflowDsl,
      nodes: [
        { key: "start", type: "requirement_lock", title: "Start" },
        { key: "agent_b", type: "ai_agent", title: "Agent B" },
        { key: "agent_a", type: "ai_agent", title: "Agent A" },
        { key: "done", type: "final_output", title: "Done" }
      ],
      edges: [
        { key: "custom_1", from: "start", to: "agent_b" },
        { key: "custom_2", from: "agent_b", to: "agent_a" },
        { key: "custom_3", from: "agent_a", to: "done" }
      ]
    };
    const visited: string[] = [];
    let node = findStartNode(dsl);
    while (node) {
      visited.push(node.key);
      const edge = selectNextEdge(dsl, node.key, state());
      node = edge ? getNode(dsl, edge.to) : undefined;
    }
    expect(visited).toEqual(["start", "agent_b", "agent_a", "done"]);
  });

  it("critic approved path goes to final_output", () => {
    const edge = selectNextEdge(defaultWorkflowDsl, "claude_critic", state({
      lastCriticOutput: { verdict: "approved" },
      lastCriticIssues: [],
      openBlockingIssues: []
    }));
    expect(edge?.to).toBe("final_output");
  });

  it("blocking issue path goes to issue_resolver then loops when iteration remains", () => {
    const blocking = state({
      lastCriticOutput: { verdict: "needs_revision" },
      lastCriticIssues: [{ severity: "HIGH" }],
      openBlockingIssues: [{ severity: "HIGH" }]
    });
    expect(selectNextEdge(defaultWorkflowDsl, "claude_critic", blocking)?.to).toBe("issue_resolver");
    expect(selectNextEdge(defaultWorkflowDsl, "issue_resolver", blocking)?.to).toBe("chatgpt_designer");
  });

  it("max iteration with blocking issues requests human review before resolver", () => {
    const blocking = state({
      iteration: 3,
      maxIterations: 3,
      lastCriticIssues: [{ severity: "HIGH" }],
      openBlockingIssues: [{ severity: "HIGH" }]
    });
    const critic = getNode(defaultWorkflowDsl, "claude_critic")!;
    const edge = selectNextEdge(defaultWorkflowDsl, "claude_critic", blocking)!;
    expect(shouldRequestHumanReviewForMaxIteration(critic, edge, blocking)).toBe(true);
  });

  it("task_type_in skips codex node for research tasks", () => {
    const edge = getOutgoingEdges(defaultWorkflowDsl, "final_output")[0];
    expect(evaluateEdgeCondition(edge, state({ taskType: "software" }))).toBe(true);
    expect(evaluateEdgeCondition(edge, state({ taskType: "research" }))).toBe(false);
  });

  it("invalid or missing next edge returns undefined instead of throwing", () => {
    expect(selectNextEdge(defaultWorkflowDsl, "codex_prompt_generator", state())).toBeUndefined();
    expect(getNode(defaultWorkflowDsl, "missing_node")).toBeUndefined();
  });
});
