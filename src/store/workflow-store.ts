import { create } from "zustand";
import { workflows as mockWorkflows } from "@/lib/mock-data";
import { buildAgentStudioWorkflowDsl, workflowService, type WorkflowTemplate } from "@/services/workflow-service";
import type { WorkflowRun } from "@/lib/types";

type WorkflowRecord = WorkflowTemplate | WorkflowRun;

interface WorkflowStore {
  workflows: WorkflowRecord[];
  activeWorkflowId: string;
  selectedNodeId: string;
  loaded: boolean;
  error?: string;
  lastRunId?: string;
  lastValidation?: string;
  setSelectedNodeId: (nodeId: string) => void;
  setActiveWorkflowId: (workflowId: string) => void;
  loadFromApi: () => Promise<void>;
  loadRunsFromApi: () => Promise<void>;
  loadRunFromApi: (runId: string) => Promise<void>;
  saveWorkflow: (workflowId: string) => Promise<WorkflowRecord>;
  validateWorkflow: (workflowId: string) => Promise<void>;
  runWorkflow: (workflowId: string) => Promise<WorkflowRun>;
  pauseWorkflowRun: (workflowId: string) => Promise<WorkflowRun>;
  resumeWorkflowRun: (workflowId: string) => Promise<WorkflowRun>;
  stopWorkflowRun: (workflowId: string) => Promise<WorkflowRun>;
  runWorkflowMock: (workflowId: string) => void;
  pauseWorkflowMock: (workflowId: string) => void;
  stopWorkflowMock: (workflowId: string) => void;
}

function isBackendId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

function getWorkflowDsl(workflow?: WorkflowRecord) {
  const dsl = (workflow as WorkflowTemplate | undefined)?.workflowDsl;
  return dsl ?? buildAgentStudioWorkflowDsl(workflow?.name ?? "Agent Studio Workflow");
}

function upsertWorkflow(workflows: WorkflowRecord[], workflow: WorkflowRecord) {
  return workflows.some((item) => item.id === workflow.id) ? workflows.map((item) => item.id === workflow.id ? workflow : item) : [workflow, ...workflows];
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
      const workflows = await workflowService.listWorkflows();
      if (workflows.length > 0) {
        set({ workflows, activeWorkflowId: workflows[0].id, loaded: true, error: undefined });
      } else {
        set({ loaded: true, error: undefined });
      }
    } catch (error) {
      set({ loaded: true, error: error instanceof Error ? error.message : "Unable to load workflows." });
    }
  },

  loadRunsFromApi: async () => {
    try {
      const workflows = await workflowService.getWorkflowRuns();
      set({
        workflows: workflows.length > 0 ? workflows : mockWorkflows,
        activeWorkflowId: workflows[0]?.id ?? get().activeWorkflowId,
        loaded: true,
        error: undefined
      });
    } catch (error) {
      set({ loaded: true, error: error instanceof Error ? error.message : "Unable to load workflow runs." });
    }
  },

  loadRunFromApi: async (runId) => {
    const run = await workflowService.getWorkflowRunById(runId);
    set((state) => ({ workflows: upsertWorkflow(state.workflows, run), activeWorkflowId: run.id, loaded: true, error: undefined }));
  },

  saveWorkflow: async (workflowId) => {
    const workflow = get().workflows.find((item) => item.id === workflowId) ?? get().workflows[0];
    const workflowDsl = getWorkflowDsl(workflow);
    const payload = {
      name: workflow?.name ?? workflowDsl.name,
      description: (workflow as WorkflowTemplate | undefined)?.description,
      projectId: workflow?.projectId && isBackendId(workflow.projectId) ? workflow.projectId : undefined,
      workflowDsl,
      maxIterations: workflow?.maxIterations ?? workflowDsl.stopConditions.maxIterations,
      maxTokens: (workflow as WorkflowTemplate | undefined)?.maxTokens ?? 100000,
      maxCostUsd: (workflow as WorkflowTemplate | undefined)?.maxCostUsd ?? 5
    };
    const saved = workflow && isBackendId(workflow.id) ? await workflowService.updateWorkflow(workflow.id, payload) : await workflowService.createWorkflow(payload);
    await workflowService.validateWorkflow(saved.id, saved.workflowDsl ?? workflowDsl);
    set((state) => ({
      workflows: upsertWorkflow(state.workflows, saved),
      activeWorkflowId: saved.id,
      loaded: true,
      error: undefined,
      lastValidation: "Workflow DSL is valid."
    }));
    return saved;
  },

  validateWorkflow: async (workflowId) => {
    const workflow = get().workflows.find((item) => item.id === workflowId);
    if (!workflow || !isBackendId(workflow.id)) throw new Error("Save the workflow before validating.");
    await workflowService.validateWorkflow(workflow.id, getWorkflowDsl(workflow));
    set({ error: undefined, lastValidation: "Workflow DSL is valid." });
  },

  runWorkflow: async (workflowId) => {
    let workflow = get().workflows.find((item) => item.id === workflowId);
    if (!workflow) throw new Error("Workflow not found.");
    if (!isBackendId(workflow.id)) workflow = await get().saveWorkflow(workflow.id);
    if (!workflow.projectId) throw new Error("Workflow must be linked to a project before it can run.");
    const run = await workflowService.runWorkflow(workflow.id, workflow.projectId);
    set((state) => ({
      workflows: state.workflows.map((item) => item.id === workflow!.id ? { ...item, status: run.status, currentNodeId: run.currentNodeId, iteration: run.iteration, totalTokens: run.totalTokens, totalCost: run.totalCost } : item),
      lastRunId: run.id,
      error: undefined
    }));
    return run;
  },

  pauseWorkflowRun: async (workflowId) => {
    const run = await workflowService.pauseWorkflowRun(workflowId);
    set((state) => ({ workflows: upsertWorkflow(state.workflows, run), error: undefined }));
    return run;
  },

  resumeWorkflowRun: async (workflowId) => {
    const run = await workflowService.resumeWorkflowRun(workflowId);
    set((state) => ({ workflows: upsertWorkflow(state.workflows, run), error: undefined }));
    return run;
  },

  stopWorkflowRun: async (workflowId) => {
    const run = await workflowService.stopWorkflowRun(workflowId);
    set((state) => ({ workflows: upsertWorkflow(state.workflows, run), error: undefined }));
    return run;
  },

  runWorkflowMock: (workflowId) =>
    set((state) => ({ activeWorkflowId: workflowId, workflows: state.workflows.map((w) => w.id === workflowId ? { ...w, status: "Running", currentNodeId: "gemini-architect" } : w) })),
  pauseWorkflowMock: (workflowId) =>
    set((state) => ({ workflows: state.workflows.map((w) => w.id === workflowId ? { ...w, status: "Paused" } : w) })),
  stopWorkflowMock: (workflowId) =>
    set((state) => ({ workflows: state.workflows.map((w) => w.id === workflowId ? { ...w, status: "Stopped" } : w) }))
}));
