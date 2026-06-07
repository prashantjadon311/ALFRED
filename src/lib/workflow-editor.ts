import type {
  WorkflowDsl,
  WorkflowEdge,
  WorkflowEdgeCondition,
  WorkflowNode,
  WorkflowNodeType,
  WorkflowPosition
} from "../types/workflow-dsl";

const NODE_TYPES = new Set([
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
]);
const CONDITION_TYPES = new Set(["has_issue_severity", "iteration_remaining", "critic_approved", "task_type_in"]);

const NODE_TITLES: Record<WorkflowNodeType, string> = {
  input: "Input",
  requirement_lock: "Requirement Lock",
  ai_agent: "AI Agent",
  consensus: "Consensus Builder",
  critic: "Critic",
  resolver: "Issue Resolver",
  budget_gate: "Budget Gate",
  human_approval: "Human Approval",
  final_output: "Final Output",
  codex_prompt_generator: "Codex Prompt Generator",
  export: "Export"
};

export function cloneWorkflowDsl(dsl: WorkflowDsl): WorkflowDsl {
  return JSON.parse(JSON.stringify(dsl)) as WorkflowDsl;
}

export function resetWorkflowDsl(savedDsl: WorkflowDsl): WorkflowDsl {
  return cloneWorkflowDsl(savedDsl);
}

export function serializeWorkflowDsl(dsl: WorkflowDsl) {
  return JSON.stringify(dsl, null, 2);
}

export function uniqueWorkflowKey(base: string, existingKeys: string[]) {
  const normalized = base.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "node";
  const keys = new Set(existingKeys);
  if (!keys.has(normalized)) return normalized;
  let suffix = 2;
  while (keys.has(`${normalized}_${suffix}`)) suffix += 1;
  return `${normalized}_${suffix}`;
}

export function getWorkflowNodePosition(node: WorkflowNode, index = 0): WorkflowPosition {
  const position = node.config?.ui?.position;
  if (position && Number.isFinite(position.x) && Number.isFinite(position.y)) return position;
  return { x: (index % 4) * 330, y: Math.floor(index / 4) * 230 };
}

export function createWorkflowNode(
  type: WorkflowNodeType,
  existingNodes: WorkflowNode[],
  position: WorkflowPosition
): WorkflowNode {
  const key = uniqueWorkflowKey(type, existingNodes.map((node) => node.key));
  const node: WorkflowNode = {
    key,
    type,
    title: NODE_TITLES[type],
    config: { ui: { position } }
  };
  if (["ai_agent", "critic", "resolver", "consensus", "codex_prompt_generator"].includes(type)) {
    node.agentRole = type === "ai_agent" ? "assistant" : type;
    node.providerPreference = "mock";
    node.promptTemplateKey = `${key}_v1`;
    node.budget = { maxTokens: 8000, maxCostUsd: 1 };
    node.config = { ...node.config, temperature: 0.4, maxTokens: 8000, retryCount: 2 };
  }
  if (type === "human_approval") {
    node.config = { ...node.config, approvalRequired: true, approvalMessage: "Review workflow output before continuing." };
  }
  return node;
}

export function addWorkflowNode(dsl: WorkflowDsl, type: WorkflowNodeType, position: WorkflowPosition) {
  const node = createWorkflowNode(type, dsl.nodes, position);
  return { dsl: { ...dsl, nodes: [...dsl.nodes, node] }, node };
}

export function updateWorkflowNode(dsl: WorkflowDsl, key: string, patch: Partial<WorkflowNode>): WorkflowDsl {
  return {
    ...dsl,
    nodes: dsl.nodes.map((node) => node.key === key ? { ...node, ...patch, key: node.key } : node)
  };
}

export function setWorkflowNodePosition(dsl: WorkflowDsl, key: string, position: WorkflowPosition): WorkflowDsl {
  return {
    ...dsl,
    nodes: dsl.nodes.map((node) =>
      node.key === key
        ? { ...node, config: { ...node.config, ui: { ...node.config?.ui, position } } }
        : node
    )
  };
}

export function deleteWorkflowNode(dsl: WorkflowDsl, key: string) {
  const node = dsl.nodes.find((item) => item.key === key);
  if (!node) return { dsl, error: "Select a node to delete." };
  if (node.type === "requirement_lock" && dsl.nodes.filter((item) => item.type === "requirement_lock").length === 1) {
    return { dsl, error: "The only requirement lock node cannot be deleted." };
  }
  if (node.type === "final_output" && dsl.nodes.filter((item) => item.type === "final_output").length === 1) {
    return { dsl, error: "The only final output node cannot be deleted." };
  }
  return {
    dsl: {
      ...dsl,
      nodes: dsl.nodes.filter((item) => item.key !== key),
      edges: dsl.edges.filter((edge) => edge.from !== key && edge.to !== key)
    }
  };
}

export function connectWorkflowNodes(dsl: WorkflowDsl, from: string, to: string) {
  if (from === to) return { dsl, error: "Self-edges are not allowed." };
  const keys = new Set(dsl.nodes.map((node) => node.key));
  if (!keys.has(from) || !keys.has(to)) return { dsl, error: "Both edge endpoints must exist." };
  if (dsl.edges.some((edge) => edge.from === from && edge.to === to)) {
    return { dsl, error: "That source-to-target edge already exists." };
  }
  const edge: WorkflowEdge = {
    key: uniqueWorkflowKey(`edge_${from}_${to}`, dsl.edges.map((item) => item.key)),
    from,
    to
  };
  return { dsl: { ...dsl, edges: [...dsl.edges, edge] }, edge };
}

export function updateWorkflowEdge(
  dsl: WorkflowDsl,
  key: string,
  patch: Partial<WorkflowEdge> & { condition?: WorkflowEdgeCondition }
): WorkflowDsl {
  return {
    ...dsl,
    edges: dsl.edges.map((edge) => edge.key === key ? { ...edge, ...patch, key: edge.key } : edge)
  };
}

export function deleteWorkflowEdge(dsl: WorkflowDsl, key: string): WorkflowDsl {
  return { ...dsl, edges: dsl.edges.filter((edge) => edge.key !== key) };
}

export function validateWorkflowDsl(dsl: WorkflowDsl): string[] {
  const errors: string[] = [];
  const keys = dsl.nodes.map((node) => node.key);
  const keySet = new Set(keys);
  if (keySet.size !== keys.length) errors.push("Node keys must be unique.");
  if (dsl.nodes.filter((node) => node.type === "requirement_lock").length !== 1) {
    errors.push("Workflow requires exactly one requirement lock node.");
  }
  if (dsl.nodes.filter((node) => node.type === "final_output").length !== 1) {
    errors.push("Workflow requires exactly one final output node.");
  }
  if (!dsl.nodes.some((node) => node.type === "critic")) errors.push("Workflow requires a critic node.");
  for (const node of dsl.nodes) {
    if (!NODE_TYPES.has(node.type)) errors.push(`Node ${node.key} uses an unknown type.`);
    if (!node.key || !/^[a-z0-9_]+$/.test(node.key)) errors.push(`Node key "${node.key}" is invalid.`);
    if (!node.title.trim()) errors.push(`Node ${node.key} requires a title.`);
  }
  const pairs = new Set<string>();
  for (const edge of dsl.edges) {
    if (!keySet.has(edge.from) || !keySet.has(edge.to)) errors.push(`Edge ${edge.key} references a missing node.`);
    if (edge.from === edge.to) errors.push(`Edge ${edge.key} cannot connect a node to itself.`);
    const pair = `${edge.from}->${edge.to}`;
    if (pairs.has(pair)) errors.push(`Duplicate edge ${pair}.`);
    pairs.add(pair);
    if (edge.condition && !CONDITION_TYPES.has(edge.condition.type)) errors.push(`Edge ${edge.key} uses an unknown condition.`);
  }
  if (dsl.edges.some((edge) => edge.condition?.type === "iteration_remaining") && dsl.stopConditions.maxIterations < 1) {
    errors.push("Loop edges require bounded iterations.");
  }
  if (!Number.isInteger(dsl.stopConditions.maxIterations) || dsl.stopConditions.maxIterations < 1 || dsl.stopConditions.maxIterations > 20) {
    errors.push("Maximum iterations must be an integer from 1 to 20.");
  }
  return errors;
}
