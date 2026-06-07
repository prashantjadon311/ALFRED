import { create } from "zustand";
import { isApiMode } from "@/lib/api-client";
import { workflows as mockWorkflows } from "@/lib/mocks/workflows";
import {
  addWorkflowNode,
  cloneWorkflowDsl,
  connectWorkflowNodes,
  deleteWorkflowEdge,
  deleteWorkflowNode,
  getWorkflowNodePosition,
  resetWorkflowDsl,
  setWorkflowNodePosition,
  updateWorkflowEdge,
  updateWorkflowNode,
  validateWorkflowDsl
} from "@/lib/workflow-editor";
import { buildAgentStudioWorkflowDsl, workflowService, type WorkflowTemplate } from "@/services/workflow-service";
import type { WorkflowRun } from "@/lib/types";
import type { WorkflowDsl, WorkflowEdge, WorkflowNode, WorkflowNodeType, WorkflowPosition } from "@/types/workflow-dsl";

type WorkflowRecord = WorkflowTemplate | WorkflowRun;

interface WorkflowStore {
  workflows: WorkflowRecord[];
  activeWorkflowId: string;
  workflowDsl: WorkflowDsl;
  savedWorkflowDsl: WorkflowDsl;
  selectedNodeId: string;
  selectedEdgeId: string;
  pendingEdgeSourceId: string;
  isDirty: boolean;
  isSaving: boolean;
  validationErrors: string[];
  lastSavedAt?: string;
  loaded: boolean;
  error?: string;
  lastRunId?: string;
  lastValidation?: string;
  setSelectedNodeId: (nodeId: string) => void;
  setSelectedEdgeId: (edgeId: string) => void;
  setActiveWorkflowId: (workflowId: string) => void;
  addNode: (type?: WorkflowNodeType) => string;
  updateNode: (key: string, patch: Partial<WorkflowNode>) => void;
  deleteSelected: () => boolean;
  connectNodes: (from: string, to: string) => string | undefined;
  beginEdgeConnection: () => boolean;
  updateEdge: (key: string, patch: Partial<WorkflowEdge>) => void;
  setNodePosition: (key: string, position: WorkflowPosition) => void;
  resetWorkflow: () => void;
  validateCurrentWorkflow: () => Promise<void>;
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
  return cloneWorkflowDsl(dsl ?? buildAgentStudioWorkflowDsl(workflow?.name ?? "Agent Studio Workflow"));
}

function upsertWorkflow(workflows: WorkflowRecord[], workflow: WorkflowRecord) {
  return workflows.some((item) => item.id === workflow.id)
    ? workflows.map((item) => item.id === workflow.id ? workflow : item)
    : [workflow, ...workflows];
}

function initialTemplates(): WorkflowTemplate[] {
  return mockWorkflows.map((workflow) => ({
    ...workflow,
    workflowDsl: buildAgentStudioWorkflowDsl(workflow.name),
    maxTokens: 100000,
    maxCostUsd: 5
  }));
}

const initialWorkflows = initialTemplates();
const initialDsl = getWorkflowDsl(initialWorkflows[0]);

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: initialWorkflows,
  activeWorkflowId: initialWorkflows[0]?.id ?? "",
  workflowDsl: initialDsl,
  savedWorkflowDsl: cloneWorkflowDsl(initialDsl),
  selectedNodeId: initialDsl.nodes[0]?.key ?? "",
  selectedEdgeId: "",
  pendingEdgeSourceId: "",
  isDirty: false,
  isSaving: false,
  validationErrors: [],
  loaded: false,

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: "" }),
  setSelectedEdgeId: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: "", pendingEdgeSourceId: "" }),
  setActiveWorkflowId: (workflowId) => {
    const workflow = get().workflows.find((item) => item.id === workflowId);
    if (!workflow) return;
    const workflowDsl = getWorkflowDsl(workflow);
    set({
      activeWorkflowId: workflowId,
      workflowDsl,
      savedWorkflowDsl: cloneWorkflowDsl(workflowDsl),
      selectedNodeId: workflowDsl.nodes[0]?.key ?? "",
      selectedEdgeId: "",
      pendingEdgeSourceId: "",
      isDirty: false,
      validationErrors: []
    });
  },

  addNode: (type = "ai_agent") => {
    const state = get();
    const selectedIndex = state.workflowDsl.nodes.findIndex((node) => node.key === state.selectedNodeId);
    const selectedPosition = selectedIndex >= 0
      ? getWorkflowNodePosition(state.workflowDsl.nodes[selectedIndex], selectedIndex)
      : { x: 0, y: 0 };
    const result = addWorkflowNode(state.workflowDsl, type, { x: selectedPosition.x + 330, y: selectedPosition.y });
    set({
      workflowDsl: result.dsl,
      selectedNodeId: result.node.key,
      selectedEdgeId: "",
      isDirty: true,
      validationErrors: []
    });
    return result.node.key;
  },

  updateNode: (key, patch) => set((state) => ({
    workflowDsl: updateWorkflowNode(state.workflowDsl, key, patch),
    isDirty: true,
    validationErrors: []
  })),

  deleteSelected: () => {
    const state = get();
    if (state.selectedEdgeId) {
      set({
        workflowDsl: deleteWorkflowEdge(state.workflowDsl, state.selectedEdgeId),
        selectedEdgeId: "",
        isDirty: true,
        validationErrors: []
      });
      return true;
    }
    const result = deleteWorkflowNode(state.workflowDsl, state.selectedNodeId);
    if (result.error) {
      set({ validationErrors: [result.error] });
      return false;
    }
    set({
      workflowDsl: result.dsl,
      selectedNodeId: result.dsl.nodes[0]?.key ?? "",
      selectedEdgeId: "",
      pendingEdgeSourceId: "",
      isDirty: true,
      validationErrors: []
    });
    return true;
  },

  connectNodes: (from, to) => {
    const result = connectWorkflowNodes(get().workflowDsl, from, to);
    if (result.error || !result.edge) {
      set({ validationErrors: [result.error ?? "Unable to create edge."], pendingEdgeSourceId: "" });
      return undefined;
    }
    set({
      workflowDsl: result.dsl,
      selectedNodeId: "",
      selectedEdgeId: result.edge.key,
      pendingEdgeSourceId: "",
      isDirty: true,
      validationErrors: []
    });
    return result.edge.key;
  },

  beginEdgeConnection: () => {
    const selectedNodeId = get().selectedNodeId;
    if (!selectedNodeId) {
      set({ validationErrors: ["Select a source node before adding an edge."] });
      return false;
    }
    set({ pendingEdgeSourceId: selectedNodeId, validationErrors: [] });
    return true;
  },

  updateEdge: (key, patch) => set((state) => ({
    workflowDsl: updateWorkflowEdge(state.workflowDsl, key, patch),
    isDirty: true,
    validationErrors: []
  })),

  setNodePosition: (key, position) => set((state) => ({
    workflowDsl: setWorkflowNodePosition(state.workflowDsl, key, position),
    isDirty: true
  })),

  resetWorkflow: () => {
    const workflowDsl = resetWorkflowDsl(get().savedWorkflowDsl);
    set({
      workflowDsl,
      selectedNodeId: workflowDsl.nodes[0]?.key ?? "",
      selectedEdgeId: "",
      pendingEdgeSourceId: "",
      isDirty: false,
      validationErrors: []
    });
  },

  validateCurrentWorkflow: async () => {
    const state = get();
    const errors = validateWorkflowDsl(state.workflowDsl);
    if (errors.length) {
      set({ validationErrors: errors, lastValidation: undefined });
      throw new Error(errors[0]);
    }
    if (isApiMode() && isBackendId(state.activeWorkflowId)) {
      await workflowService.validateWorkflow(state.activeWorkflowId, state.workflowDsl);
    }
    set({ validationErrors: [], error: undefined, lastValidation: "Workflow DSL is valid." });
  },

  loadFromApi: async () => {
    if (get().loaded) return;
    try {
      const workflows = await workflowService.listWorkflows();
      if (workflows.length > 0) {
        const workflowDsl = getWorkflowDsl(workflows[0]);
        set({
          workflows,
          activeWorkflowId: workflows[0].id,
          workflowDsl,
          savedWorkflowDsl: cloneWorkflowDsl(workflowDsl),
          selectedNodeId: workflowDsl.nodes[0]?.key ?? "",
          selectedEdgeId: "",
          loaded: true,
          error: undefined,
          isDirty: false,
          validationErrors: []
        });
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
        workflows: workflows.length > 0 ? workflows : initialWorkflows,
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
    const state = get();
    const workflow = state.workflows.find((item) => item.id === workflowId) ?? state.workflows[0];
    const workflowDsl = state.activeWorkflowId === workflowId ? state.workflowDsl : getWorkflowDsl(workflow);
    const errors = validateWorkflowDsl(workflowDsl);
    if (errors.length) {
      set({ validationErrors: errors });
      throw new Error(errors[0]);
    }
    const payload = {
      name: workflowDsl.name,
      description: (workflow as WorkflowTemplate | undefined)?.description,
      projectId: workflow?.projectId && (!isApiMode() || isBackendId(workflow.projectId)) ? workflow.projectId : undefined,
      workflowDsl,
      maxIterations: workflow?.maxIterations ?? workflowDsl.stopConditions.maxIterations,
      maxTokens: (workflow as WorkflowTemplate | undefined)?.maxTokens ?? 100000,
      maxCostUsd: (workflow as WorkflowTemplate | undefined)?.maxCostUsd ?? 5
    };
    set({ isSaving: true });
    try {
      const shouldUpdate = Boolean(workflow) && (!isApiMode() || isBackendId(workflow.id));
      const saved = shouldUpdate
        ? await workflowService.updateWorkflow(workflow!.id, payload)
        : await workflowService.createWorkflow(payload);
      await workflowService.validateWorkflow(saved.id, saved.workflowDsl ?? workflowDsl);
      const savedDsl = getWorkflowDsl(saved);
      const savedAt = new Date().toISOString();
      set((current) => ({
        workflows: upsertWorkflow(current.workflows.filter((item) => item.id !== workflowId || item.id === saved.id), saved),
        activeWorkflowId: saved.id,
        workflowDsl: savedDsl,
        savedWorkflowDsl: cloneWorkflowDsl(savedDsl),
        selectedNodeId: savedDsl.nodes.some((node) => node.key === current.selectedNodeId) ? current.selectedNodeId : savedDsl.nodes[0]?.key ?? "",
        selectedEdgeId: savedDsl.edges.some((edge) => edge.key === current.selectedEdgeId) ? current.selectedEdgeId : "",
        loaded: true,
        error: undefined,
        lastValidation: "Workflow DSL is valid.",
        validationErrors: [],
        isDirty: false,
        isSaving: false,
        lastSavedAt: savedAt
      }));
      return saved;
    } catch (error) {
      set({ isSaving: false, error: error instanceof Error ? error.message : "Unable to save workflow." });
      throw error;
    }
  },

  validateWorkflow: async (workflowId) => {
    if (workflowId === get().activeWorkflowId) return get().validateCurrentWorkflow();
    const workflow = get().workflows.find((item) => item.id === workflowId);
    if (!workflow) throw new Error("Workflow not found.");
    const workflowDsl = getWorkflowDsl(workflow);
    const errors = validateWorkflowDsl(workflowDsl);
    if (errors.length) throw new Error(errors[0]);
    if (isApiMode() && isBackendId(workflow.id)) await workflowService.validateWorkflow(workflow.id, workflowDsl);
    set({ error: undefined, lastValidation: "Workflow DSL is valid.", validationErrors: [] });
  },

  runWorkflow: async (workflowId) => {
    let workflow = get().workflows.find((item) => item.id === workflowId);
    if (!workflow) throw new Error("Workflow not found.");
    await get().validateCurrentWorkflow();
    if (get().isDirty || (isApiMode() && !isBackendId(workflow.id))) {
      workflow = await get().saveWorkflow(workflow.id);
    }
    if (!workflow.projectId) throw new Error("Workflow must be linked to a project before it can run.");
    const run = await workflowService.runWorkflow(workflow.id, workflow.projectId);
    set((state) => ({
      workflows: state.workflows.map((item) => item.id === workflow!.id
        ? { ...item, status: run.status, currentNodeId: run.currentNodeId, iteration: run.iteration, totalTokens: run.totalTokens, totalCost: run.totalCost }
        : item),
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
    set((state) => ({ activeWorkflowId: workflowId, workflows: state.workflows.map((w) => w.id === workflowId ? { ...w, status: "Running", currentNodeId: "gemini_architect" } : w) })),
  pauseWorkflowMock: (workflowId) =>
    set((state) => ({ workflows: state.workflows.map((w) => w.id === workflowId ? { ...w, status: "Paused" } : w) })),
  stopWorkflowMock: (workflowId) =>
    set((state) => ({ workflows: state.workflows.map((w) => w.id === workflowId ? { ...w, status: "Stopped" } : w) }))
}));
