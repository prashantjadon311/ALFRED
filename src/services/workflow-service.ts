import { agentNodes as mockNodes, workflows as mockWorkflows } from "@/lib/mock-data";
import type { WorkflowRun, WorkflowStatus } from "@/lib/types";

const wait = () => new Promise((resolve) => setTimeout(resolve, 120));

function patchRun(id: string, patch: Partial<WorkflowRun>): WorkflowRun {
  const run = mockWorkflows.find((workflow) => workflow.id === id) ?? mockWorkflows[0];
  return { ...run, ...patch };
}

export const workflowService = {
  getWorkflowRuns: async (): Promise<WorkflowRun[]> => {
    await wait();
    return mockWorkflows;
  },

  listRuns: async (): Promise<WorkflowRun[]> => workflowService.getWorkflowRuns(),

  getWorkflowRunById: async (id: string): Promise<WorkflowRun> => {
    await wait();
    return mockWorkflows.find((workflow) => workflow.id === id) ?? mockWorkflows[0];
  },

  getRun: async (id: string): Promise<WorkflowRun> => workflowService.getWorkflowRunById(id),

  getWorkflowGraphState: async (id: string) => {
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

  pauseRun: async (id: string) => patchRun(id, { status: "Paused" }),
  resumeRun: async (id: string) => patchRun(id, { status: "Running" }),
  stopRun: async (id: string) => patchRun(id, { status: "Stopped" as WorkflowStatus }),

  startRun: async (_workflowId: string, projectId: string): Promise<WorkflowRun> => {
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
