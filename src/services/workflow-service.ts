import { agentNodes as mockNodes, workflows as mockWorkflows } from "@/lib/mocks/workflows";
import { api, isApiMode } from "@/lib/api-client";
import type { AgentNode, AgentStatus, Severity, WorkflowRun, WorkflowStatus } from "@/lib/types";
import type { WorkflowDsl } from "@/types/workflow-dsl";
import { demoWait } from "./mock-latency";

const wait = () => demoWait(120);
const MOCK_WORKFLOW_STORAGE_KEY = "alfred_mock_workflow_templates";

export type WorkflowTemplate = WorkflowRun & {
  description?: string;
  workflowDsl?: WorkflowDsl;
  maxTokens?: number;
  maxCostUsd?: number;
};

export type WorkflowListParams = {
  page?: number;
  limit?: number;
  projectId?: string;
};

export type WorkflowGraphEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type WorkflowGraphState = {
  run: WorkflowRun;
  nodes: AgentNode[];
  edges: WorkflowGraphEdge[];
  events: WorkflowEventRecord[];
  activeNodeId?: string;
  nodeStatuses: Record<string, string>;
};

export type WorkflowEventRecord = {
  id?: string;
  eventType: string;
  workflowRunId?: string;
  projectId?: string;
  nodeKey?: string | null;
  edgeKey?: string | null;
  timestamp: string;
  createdAt?: string;
  message?: string;
  data: Record<string, unknown>;
};

export type WorkflowIssueRecord = {
  id: string;
  title: string;
  severity: Severity;
  affectedArea?: string;
  recommendation?: string;
  status?: string;
};

export type WorkflowArtifactRecord = {
  id: string;
  title: string;
  type: string;
  createdAt?: string;
};

export type WorkflowRunDetail = {
  run: WorkflowRun;
  graphState: WorkflowGraphState;
  logs: WorkflowEventRecord[];
  issues: WorkflowIssueRecord[];
  artifacts: WorkflowArtifactRecord[];
};

export type WorkflowSaveInput = {
  name: string;
  description?: string;
  projectId?: string;
  workflowDsl: WorkflowDsl;
  maxIterations?: number;
  maxTokens?: number;
  maxCostUsd?: number;
};

export function buildAgentStudioWorkflowDsl(name = "Agent Studio Workflow"): WorkflowDsl {
  return {
    version: "1.0",
    name,
    nodes: [
      { key: "requirement_lock", type: "requirement_lock", title: "Requirement Lock", config: { ui: { position: { x: 0, y: 0 } } } },
      { key: "chatgpt_designer", type: "ai_agent", title: "ChatGPT Designer", agentRole: "product_designer", providerPreference: "openai", modelPreference: "GPT-5", promptTemplateKey: "chatgpt_designer_v1", budget: { maxTokens: 8000, maxCostUsd: 1 }, config: { temperature: 0.4, maxTokens: 8000, retryCount: 2, ui: { position: { x: 330, y: -120 } } } },
      { key: "gemini_architect", type: "ai_agent", title: "Gemini Architect", agentRole: "software_architect", providerPreference: "gemini", promptTemplateKey: "gemini_architect_v1", config: { temperature: 0.3, maxTokens: 8000, retryCount: 2, ui: { position: { x: 330, y: 150 } } } },
      { key: "consensus_builder", type: "consensus", title: "Consensus Builder", promptTemplateKey: "consensus_builder_v1", config: { ui: { position: { x: 660, y: 0 } } } },
      { key: "claude_critic", type: "critic", title: "Claude Critic", agentRole: "critic", providerPreference: "anthropic", promptTemplateKey: "claude_critic_v1", config: { temperature: 0.2, maxTokens: 8000, retryCount: 2, ui: { position: { x: 990, y: 0 } } } },
      { key: "issue_resolver", type: "resolver", title: "Issue Resolver", promptTemplateKey: "issue_resolver_v1", config: { ui: { position: { x: 1320, y: -120 } } } },
      { key: "final_output", type: "final_output", title: "Final Output Generator", promptTemplateKey: "final_output_v1", config: { ui: { position: { x: 1320, y: 150 } } } },
      { key: "codex_prompt_generator", type: "codex_prompt_generator", title: "Codex Prompt Generator", promptTemplateKey: "codex_prompt_generator_v1", config: { ui: { position: { x: 1650, y: 150 } } } }
    ],
    edges: [
      { key: "e1", from: "requirement_lock", to: "chatgpt_designer" },
      { key: "e2", from: "chatgpt_designer", to: "gemini_architect" },
      { key: "e3", from: "gemini_architect", to: "consensus_builder" },
      { key: "e4", from: "consensus_builder", to: "claude_critic" },
      { key: "e5", from: "claude_critic", to: "issue_resolver", condition: { type: "has_issue_severity", severityIn: ["BLOCKER", "HIGH"] } },
      { key: "e6", from: "issue_resolver", to: "chatgpt_designer", condition: { type: "iteration_remaining" } },
      { key: "e7", from: "claude_critic", to: "final_output", condition: { type: "critic_approved" } },
      { key: "e8", from: "final_output", to: "codex_prompt_generator", condition: { type: "task_type_in", values: ["software", "mixed"] } }
    ],
    stopConditions: { maxIterations: 3, stopOnBudgetExceeded: true, stopOnRequirementDrift: true, stopOnUserStop: true }
  };
}

function defaultMockTemplates(): WorkflowTemplate[] {
  return mockWorkflows.map((workflow) => ({
    ...workflow,
    workflowDsl: buildAgentStudioWorkflowDsl(workflow.name),
    maxTokens: 100000,
    maxCostUsd: 5
  }));
}

function readMockTemplates(): WorkflowTemplate[] {
  if (typeof window === "undefined") return defaultMockTemplates();
  try {
    const stored = window.localStorage.getItem(MOCK_WORKFLOW_STORAGE_KEY);
    return stored ? JSON.parse(stored) as WorkflowTemplate[] : defaultMockTemplates();
  } catch {
    return defaultMockTemplates();
  }
}

function writeMockTemplates(workflows: WorkflowTemplate[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MOCK_WORKFLOW_STORAGE_KEY, JSON.stringify(workflows));
  }
}

function patchRun(id: string, patch: Partial<WorkflowRun>): WorkflowRun {
  const run = mockWorkflows.find((workflow) => workflow.id === id) ?? mockWorkflows[0];
  return { ...run, ...patch };
}
const status = (value?: string): WorkflowStatus => {
  if (value === "running" || value === "queued") return "Running";
  if (value === "paused") return "Paused";
  if (value === "completed") return "Completed";
  if (value === "failed") return "Failed";
  if (value === "needs_human_review" || value === "waiting_approval") return "Waiting Approval";
  return "Stopped";
};

const nodeStatus = (value?: string): AgentStatus => {
  if (value === "running") return "Running";
  if (value === "completed") return "Success";
  if (value === "failed") return "Failed";
  if (value === "paused") return "Paused";
  if (value === "needs_human_review" || value === "waiting_approval") return "Needs Approval";
  return "Pending";
};

const severity = (value?: string): Severity => {
  if (value === "BLOCKER" || value === "Blocker") return "Blocker";
  if (value === "HIGH" || value === "High") return "High";
  if (value === "MEDIUM" || value === "Medium") return "Medium";
  return "Low";
};

function normalizeRun(run: any): WorkflowRun {
  return {
    id: run.id,
    projectId: run.projectId,
    workflowId: run.workflowId,
    name: run.name ?? run.workflowDslSnapshot?.name ?? "A.L.F.R.E.D. Workflow Run",
    status: status(run.status),
    currentNodeId: run.currentNodeKey ?? "requirement-lock",
    iteration: run.iteration ?? 0,
    maxIterations: run.maxIterations ?? 3,
    totalTokens: (run.totalInputTokens ?? 0) + (run.totalOutputTokens ?? 0),
    totalCost: run.totalCostUsd ?? 0,
    startedAt: run.startedAt ?? run.createdAt,
    duration: run.completedAt ? "completed" : "running",
    claudeVerdict: run.claudeVerdict ?? ""
  };
}

function normalizeGraphNode(node: any, activeNodeId?: string): AgentNode {
  const statusValue = node.status ?? (node.key === activeNodeId ? "running" : "pending");
  return {
    id: node.key,
    title: node.title ?? node.key,
    provider: node.providerPreference ?? "mock",
    model: node.modelPreference ?? node.promptTemplateKey ?? node.type,
    role: node.agentRole ?? node.type,
    status: nodeStatus(statusValue),
    inputTokens: Number(node.inputTokens ?? 0),
    outputTokens: Number(node.outputTokens ?? 0),
    cost: Number(node.costUsd ?? 0),
    latency: Number(node.latencyMs ?? 0),
    systemPrompt: String(node.promptTemplateKey ?? node.type ?? "")
  };
}

function normalizeGraphEdge(edge: any): WorkflowGraphEdge {
  return {
    id: edge.key,
    source: edge.from,
    target: edge.to,
    label: edge.condition?.type
  };
}

function normalizeEvent(event: any): WorkflowEventRecord {
  return {
    id: event.id,
    eventType: event.eventType,
    workflowRunId: event.workflowRunId,
    projectId: event.projectId,
    nodeKey: event.nodeKey ?? null,
    edgeKey: event.edgeKey ?? null,
    timestamp: event.timestamp ?? event.createdAt ?? new Date().toISOString(),
    createdAt: event.createdAt ?? event.timestamp,
    message: event.message,
    data: event.data ?? {}
  };
}

function normalizeIssue(issue: any): WorkflowIssueRecord {
  return {
    id: issue.id,
    title: issue.title,
    severity: severity(issue.severity),
    affectedArea: issue.affectedArea,
    recommendation: issue.recommendation,
    status: issue.status
  };
}

function normalizeArtifact(artifact: any): WorkflowArtifactRecord {
  return {
    id: artifact.id,
    title: artifact.title,
    type: artifact.type,
    createdAt: artifact.createdAt
  };
}

function normalizeWorkflow(workflow: any): WorkflowTemplate {
  const workflowDsl = (workflow.workflowDsl ?? buildAgentStudioWorkflowDsl(workflow.name)) as WorkflowDsl;
  return {
    id: workflow.id,
    projectId: workflow.projectId ?? "",
    name: workflow.name ?? workflowDsl.name ?? "Agent Studio Workflow",
    status: status(workflow.status),
    currentNodeId: workflowDsl.nodes[0]?.key ?? "requirement_lock",
    iteration: 0,
    maxIterations: workflow.maxIterations ?? workflowDsl.stopConditions.maxIterations,
    totalTokens: 0,
    totalCost: 0,
    startedAt: workflow.updatedAt ?? workflow.createdAt ?? "",
    duration: "template",
    claudeVerdict: "Ready to validate and run.",
    description: workflow.description,
    workflowDsl,
    maxTokens: workflow.maxTokens,
    maxCostUsd: workflow.maxCostUsd
  };
}

function normalizeWorkflowGraphState(id: string, graph: any): WorkflowGraphState {
  const dsl = graph.dsl ?? graph.run?.workflowDslSnapshot;
  const run = normalizeRun(graph.run ?? {
    id,
    status: graph.status,
    currentNodeKey: graph.currentNodeKey,
    iteration: graph.iteration,
    maxIterations: dsl?.stopConditions?.maxIterations,
    totalInputTokens: graph.totalInputTokens,
    totalOutputTokens: graph.totalOutputTokens,
    totalCostUsd: graph.totalCostUsd,
    claudeVerdict: graph.run?.claudeVerdict
  });
  const activeNodeId = graph.currentNodeKey ?? graph.run?.currentNodeKey;
  return {
    run,
    nodes: (graph.nodes ?? dsl?.nodes ?? []).map((node: any) => normalizeGraphNode(node, activeNodeId)),
    edges: (graph.edges ?? dsl?.edges ?? []).map(normalizeGraphEdge),
    events: (graph.events ?? []).map(normalizeEvent),
    activeNodeId,
    nodeStatuses: graph.nodeStatuses ?? {}
  };
}

export const workflowService = {
  listWorkflows: async (params: WorkflowListParams = {}): Promise<WorkflowTemplate[]> => {
    if (isApiMode()) {
      const query = new URLSearchParams();
      if (params.page) query.set("page", String(params.page));
      if (params.limit) query.set("limit", String(params.limit));
      if (params.projectId) query.set("projectId", params.projectId);
      const suffix = query.toString();
      return (await api.get<any[]>(`/workflows${suffix ? `?${suffix}` : ""}`)).map(normalizeWorkflow);
    }
    await wait();
    const workflows = readMockTemplates().filter((workflow) => !params.projectId || workflow.projectId === params.projectId);
    return params.limit ? workflows.slice(0, params.limit) : workflows;
  },

  getWorkflow: async (id: string): Promise<WorkflowTemplate> => {
    if (isApiMode()) return normalizeWorkflow(await api.get<any>(`/workflows/${id}`));
    await wait();
    const workflow = readMockTemplates().find((item) => item.id === id);
    if (!workflow) throw new Error("Workflow not found.");
    return workflow;
  },

  createWorkflow: async (input: WorkflowSaveInput): Promise<WorkflowTemplate> => {
    if (isApiMode()) return normalizeWorkflow(await api.post<any>("/workflows", input));
    await wait();
    const workflow: WorkflowTemplate = {
      id: `workflow-${Date.now()}`,
      projectId: input.projectId ?? "",
      name: input.name,
      status: "Stopped",
      currentNodeId: input.workflowDsl.nodes[0]?.key ?? "requirement_lock",
      iteration: 0,
      maxIterations: input.maxIterations ?? input.workflowDsl.stopConditions.maxIterations,
      totalTokens: 0,
      totalCost: 0,
      startedAt: new Date().toISOString(),
      duration: "template",
      claudeVerdict: "Ready to validate and run.",
      description: input.description,
      workflowDsl: input.workflowDsl,
      maxTokens: input.maxTokens,
      maxCostUsd: input.maxCostUsd
    };
    const workflows = [workflow, ...readMockTemplates()];
    writeMockTemplates(workflows);
    return workflow;
  },

  updateWorkflow: async (id: string, input: WorkflowSaveInput): Promise<WorkflowTemplate> => {
    if (isApiMode()) return normalizeWorkflow(await api.patch<any>(`/workflows/${id}`, input));
    await wait();
    const workflow: WorkflowTemplate = {
      id,
      projectId: input.projectId ?? "",
      name: input.name,
      status: "Stopped",
      currentNodeId: input.workflowDsl.nodes[0]?.key ?? "requirement_lock",
      iteration: 0,
      maxIterations: input.maxIterations ?? input.workflowDsl.stopConditions.maxIterations,
      totalTokens: 0,
      totalCost: 0,
      startedAt: new Date().toISOString(),
      duration: "template",
      claudeVerdict: "Ready to validate and run.",
      description: input.description,
      workflowDsl: input.workflowDsl,
      maxTokens: input.maxTokens,
      maxCostUsd: input.maxCostUsd
    };
    const workflows = readMockTemplates();
    writeMockTemplates(workflows.some((item) => item.id === id)
      ? workflows.map((item) => item.id === id ? workflow : item)
      : [workflow, ...workflows]);
    return workflow;
  },

  validateWorkflow: async (id: string, workflowDsl?: WorkflowDsl): Promise<{ valid: boolean; dsl?: WorkflowDsl }> => {
    if (isApiMode()) return api.post<{ valid: boolean; dsl?: WorkflowDsl }>(`/workflows/${id}/validate`, workflowDsl ? { workflowDsl } : {});
    await wait();
    return { valid: true, dsl: workflowDsl ?? buildAgentStudioWorkflowDsl() };
  },

  runWorkflow: async (workflowId: string, projectId: string): Promise<WorkflowRun> => {
    if (isApiMode()) return normalizeRun(await api.post<any>(`/workflows/${workflowId}/run`, { projectId }));
    return workflowService.startRun(workflowId, projectId);
  },

  getWorkflowRuns: async (): Promise<WorkflowRun[]> => {
    if (isApiMode()) return (await api.get<any[]>("/workflow-runs")).map(normalizeRun);
    await wait();
    return mockWorkflows;
  },

  listRuns: async (): Promise<WorkflowRun[]> => workflowService.getWorkflowRuns(),

  getWorkflowRunById: async (id: string): Promise<WorkflowRun> => {
    if (isApiMode()) return normalizeRun(await api.get<any>(`/workflow-runs/${id}`));
    await wait();
    return mockWorkflows.find((workflow) => workflow.id === id) ?? mockWorkflows[0];
  },

  getWorkflowRun: async (id: string): Promise<WorkflowRun> => workflowService.getWorkflowRunById(id),

  getRun: async (id: string): Promise<WorkflowRun> => workflowService.getWorkflowRunById(id),

  getWorkflowRunGraphState: async (id: string): Promise<WorkflowGraphState> => {
    if (isApiMode()) {
      const graph = await api.get<any>(`/workflow-runs/${id}/graph-state`);
      return normalizeWorkflowGraphState(id, graph);
    }
    await wait();
    const run = mockWorkflows.find((workflow) => workflow.id === id) ?? mockWorkflows[0];
    return {
      run,
      nodes: mockNodes,
      edges: [],
      events: [],
      activeNodeId: run.currentNodeId,
      nodeStatuses: Object.fromEntries(mockNodes.map((node) => [node.id, node.status]))
    };
  },

  getWorkflowGraphState: async (id: string) => workflowService.getWorkflowRunGraphState(id),

  getGraphState: async (id: string) => workflowService.getWorkflowGraphState(id),

  getWorkflowRunDetail: async (id: string): Promise<WorkflowRunDetail> => {
    if (isApiMode()) {
      const detail = await api.get<any>(`/workflow-runs/${id}/detail`);
      return {
        run: normalizeRun(detail.run ?? detail.graphState?.run ?? { id }),
        graphState: normalizeWorkflowGraphState(id, detail.graphState ?? {}),
        logs: (detail.logs ?? []).map(normalizeEvent),
        issues: (detail.issues ?? []).map(normalizeIssue),
        artifacts: (detail.artifacts ?? []).map(normalizeArtifact)
      };
    }
    await wait();
    const run = mockWorkflows.find((workflow) => workflow.id === id) ?? mockWorkflows[0];
    return {
      run,
      graphState: {
        run,
        nodes: mockNodes,
        edges: [],
        events: [],
        activeNodeId: run.currentNodeId,
        nodeStatuses: Object.fromEntries(mockNodes.map((node) => [node.id, node.status]))
      },
      logs: [],
      issues: [],
      artifacts: []
    };
  },

  getRunDetail: async (id: string) => workflowService.getWorkflowRunDetail(id),

  getWorkflowRunEvents: async (id: string): Promise<WorkflowEventRecord[]> => {
    if (isApiMode()) return (await api.get<any[]>(`/workflow-runs/${id}/events?limit=200`)).map(normalizeEvent);
    await wait();
    return [];
  },

  getWorkflowEvents: async (id: string) => workflowService.getWorkflowRunEvents(id),

  getWorkflowRunLogs: async (id: string): Promise<WorkflowEventRecord[]> => {
    if (isApiMode()) return (await api.get<any[]>(`/workflow-runs/${id}/logs?limit=200`)).map(normalizeEvent);
    await wait();
    return [];
  },

  getWorkflowRunIssues: async (id: string): Promise<WorkflowIssueRecord[]> => {
    if (isApiMode()) return (await api.get<any[]>(`/workflow-runs/${id}/issues`)).map(normalizeIssue);
    await wait();
    return [];
  },

  getWorkflowRunArtifacts: async (id: string): Promise<WorkflowArtifactRecord[]> => {
    if (isApiMode()) return (await api.get<any[]>(`/workflow-runs/${id}/artifacts`)).map(normalizeArtifact);
    await wait();
    return [];
  },

  getNodes: async () => {
    await wait();
    return mockNodes;
  },

  pauseWorkflowRun: async (id: string) => {
    if (!isApiMode()) return patchRun(id, { status: "Paused" });
    return normalizeRun(await api.post<any>(`/workflow-runs/${id}/pause`));
  },
  pauseRun: async (id: string) => workflowService.pauseWorkflowRun(id),

  resumeWorkflowRun: async (id: string) => {
    if (!isApiMode()) return patchRun(id, { status: "Running" });
    return normalizeRun(await api.post<any>(`/workflow-runs/${id}/resume`));
  },
  resumeRun: async (id: string) => workflowService.resumeWorkflowRun(id),

  stopWorkflowRun: async (id: string) => {
    if (!isApiMode()) return patchRun(id, { status: "Stopped" as WorkflowStatus });
    return normalizeRun(await api.post<any>(`/workflow-runs/${id}/stop`));
  },
  stopRun: async (id: string) => workflowService.stopWorkflowRun(id),

  startRun: async (_workflowId: string, projectId: string): Promise<WorkflowRun> => {
    if (isApiMode()) return normalizeRun(await api.post<any>(`/workflows/${_workflowId}/run`, { projectId }));
    await wait();
    return {
      id: `wf-run-${Date.now()}`,
      projectId,
      name: "Mock Agentic Execution Loop",
      status: "Running",
      currentNodeId: "requirement-lock",
      iteration: 1,
      maxIterations: 6,
      totalTokens: 0,
      totalCost: 0,
      startedAt: new Date().toISOString(),
      duration: "0m 00s",
      claudeVerdict: "Queued for mock Claude critic review."
    };
  }
};
