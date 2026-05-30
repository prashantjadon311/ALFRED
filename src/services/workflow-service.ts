import { agentNodes as mockNodes, workflows as mockWorkflows } from "@/lib/mock-data";
import { api, isApiMode } from "@/lib/api-client";
import type { WorkflowRun, WorkflowStatus } from "@/lib/types";

const wait = () => new Promise((resolve) => setTimeout(resolve, 120));

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

function normalizeRun(run: any): WorkflowRun {
  return {
    id: run.id,
    projectId: run.projectId,
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

export const workflowService = {
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

  getRun: async (id: string): Promise<WorkflowRun> => workflowService.getWorkflowRunById(id),

  getWorkflowGraphState: async (id: string) => {
    if (isApiMode()) {
      const graph = await api.get<any>(`/workflow-runs/${id}/graph-state`);
      return {
        run: graph.run ? normalizeRun(graph.run) : null,
        nodes: graph.run?.workflowDslSnapshot?.nodes ?? mockNodes,
        events: graph.events ?? [],
        activeNodeId: graph.run?.currentNodeKey,
        nodeStatuses: {}
      };
    }
    await wait();
    const run = mockWorkflows.find((workflow) => workflow.id === id) ?? mockWorkflows[0];
    return {
      run,
      nodes: mockNodes,
      activeNodeId: run.currentNodeId,
      nodeStatuses: Object.fromEntries(mockNodes.map((node) => [node.id, node.status]))
    };
  },

  getGraphState: async (id: string) => workflowService.getWorkflowGraphState(id),

  getNodes: async () => {
    await wait();
    return mockNodes;
  },

  pauseRun: async (id: string) => {
    if (!isApiMode()) return patchRun(id, { status: "Paused" });
    await api.post(`/workflow-runs/${id}/pause`);
    return workflowService.getWorkflowRunById(id);
  },
  resumeRun: async (id: string) => {
    if (!isApiMode()) return patchRun(id, { status: "Running" });
    await api.post(`/workflow-runs/${id}/resume`);
    return workflowService.getWorkflowRunById(id);
  },
  stopRun: async (id: string) => {
    if (!isApiMode()) return patchRun(id, { status: "Stopped" as WorkflowStatus });
    await api.post(`/workflow-runs/${id}/stop`);
    return workflowService.getWorkflowRunById(id);
  },

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
