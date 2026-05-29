import { create } from "zustand";
import { workflows as mockWorkflows, agentNodes as mockNodes } from "@/lib/mock-data";
import { workflowService } from "@/services/workflow-service";
import type { WorkflowRun } from "@/lib/types";

interface WorkflowStore {
  workflows: WorkflowRun[];
  activeWorkflowId: string;
  selectedNodeId: string;
  loaded: boolean;
  setSelectedNodeId: (nodeId: string) => void;
  setActiveWorkflowId: (workflowId: string) => void;
  loadFromApi: () => Promise<void>;
  runWorkflowMock: (workflowId: string) => void;
  pauseWorkflowMock: (workflowId: string) => void;
  stopWorkflowMock: (workflowId: string) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: mockWorkflows,
  activeWorkflowId: mockWorkflows[0]?.id ?? "",
  selectedNodeId: "gemini-architect",
  loaded: false,

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),
  setActiveWorkflowId: (workflowId) => set({ activeWorkflowId: workflowId }),

  loadFromApi: async () => {
    if (get().loaded) return;
    try {
      const workflows = await workflowService.listRuns();
      if (workflows.length > 0) {
        set({ workflows, activeWorkflowId: workflows[0].id, loaded: true });
      }
    } catch { /* keep mock data */ }
  },

  runWorkflowMock: (workflowId) =>
    set((state) => ({ activeWorkflowId: workflowId, workflows: state.workflows.map((w) => w.id === workflowId ? { ...w, status: "Running", currentNodeId: "gemini-architect" } : w) })),
  pauseWorkflowMock: (workflowId) =>
    set((state) => ({ workflows: state.workflows.map((w) => w.id === workflowId ? { ...w, status: "Paused" } : w) })),
  stopWorkflowMock: (workflowId) =>
    set((state) => ({ workflows: state.workflows.map((w) => w.id === workflowId ? { ...w, status: "Stopped" } : w) }))
}));
