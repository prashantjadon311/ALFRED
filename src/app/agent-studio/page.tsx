"use client";

import { CirclePlus, Play, Save, ShieldCheck, Workflow } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { NodePropertiesPanel } from "@/components/workflow/NodePropertiesPanel";
import type { WorkflowToolbarActions } from "@/components/workflow/WorkflowCanvasToolbar";
import { WorkflowStatusBar } from "@/components/workflow/WorkflowStatusBar";
import { serializeWorkflowDsl } from "@/lib/workflow-editor";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import { useWorkflowStore } from "@/store/workflow-store";

const WorkflowGraph = dynamic(() => import("@/components/workflow/WorkflowGraph").then((mod) => mod.WorkflowGraph), {
  ssr: false,
  loading: () => <div className="h-full min-h-[420px] animate-pulse rounded-panel border border-surface-darkBorder bg-surface-darkElevated/50" />
});

export default function AgentStudioPage() {
  const fullScreen = useUiStore((state) => state.fullScreenPage) === "agent-studio";
  const workflows = useWorkflowStore((state) => state.workflows);
  const activeWorkflowId = useWorkflowStore((state) => state.activeWorkflowId);
  const loadFromApi = useWorkflowStore((state) => state.loadFromApi);
  const saveWorkflow = useWorkflowStore((state) => state.saveWorkflow);
  const validateCurrentWorkflow = useWorkflowStore((state) => state.validateCurrentWorkflow);
  const runWorkflow = useWorkflowStore((state) => state.runWorkflow);
  const addNode = useWorkflowStore((state) => state.addNode);
  const beginEdgeConnection = useWorkflowStore((state) => state.beginEdgeConnection);
  const deleteSelected = useWorkflowStore((state) => state.deleteSelected);
  const resetWorkflow = useWorkflowStore((state) => state.resetWorkflow);
  const workflowDsl = useWorkflowStore((state) => state.workflowDsl);
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const selectedEdgeId = useWorkflowStore((state) => state.selectedEdgeId);
  const isDirty = useWorkflowStore((state) => state.isDirty);
  const lastSavedAt = useWorkflowStore((state) => state.lastSavedAt);
  const validationErrors = useWorkflowStore((state) => state.validationErrors);
  const activeWorkflow = workflows.find((item) => item.id === activeWorkflowId) ?? workflows[0];
  const [notice, setNotice] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [busyAction, setBusyAction] = useState<"save" | "run" | "validate" | null>(null);

  useEffect(() => {
    void loadFromApi();
  }, [loadFromApi]);

  const showNotice = (message: string, tone: "success" | "error" = "success") => {
    setNotice({ message, tone });
    window.setTimeout(() => setNotice(null), 2200);
  };

  const handleSave = async () => {
    if (!activeWorkflow) return;
    setBusyAction("save");
    try {
      await saveWorkflow(activeWorkflow.id);
      showNotice("Workflow template saved and validated.");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Unable to save workflow template.", "error");
    } finally {
      setBusyAction(null);
    }
  };

  const handleRun = async () => {
    if (!activeWorkflow) return;
    setBusyAction("run");
    try {
      const run = await runWorkflow(activeWorkflow.id);
      showNotice(`Workflow run started: ${run.id}`);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Unable to run workflow.", "error");
    } finally {
      setBusyAction(null);
    }
  };

  const handleValidate = async () => {
    setBusyAction("validate");
    try {
      await validateCurrentWorkflow();
      showNotice("Workflow DSL is valid.");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Workflow validation failed.", "error");
    } finally {
      setBusyAction(null);
    }
  };

  const handleAddNode = () => {
    const key = addNode("ai_agent");
    showNotice(`Added ${key}.`);
  };

  const handleAddEdge = () => {
    if (beginEdgeConnection()) showNotice("Select a target node or drag from the source handle.");
    else showNotice("Select a source node before adding an edge.", "error");
  };

  const handleDelete = () => {
    if (!selectedNodeId && !selectedEdgeId) return;
    if (!window.confirm(`Delete the selected ${selectedEdgeId ? "edge" : "node"}?`)) return;
    if (!deleteSelected()) showNotice("Required workflow nodes cannot be deleted.", "error");
  };

  const handleReset = () => {
    if (isDirty && !window.confirm("Discard unsaved workflow changes?")) return;
    resetWorkflow();
    showNotice("Workflow reset to the last saved DSL.");
  };

  const handleExport = () => {
    const content = serializeWorkflowDsl(workflowDsl);
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${workflowDsl.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "workflow"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice("Workflow DSL exported.");
  };

  if (!activeWorkflow) return null;

  const toolbarActions: WorkflowToolbarActions = {
    onAddNode: handleAddNode,
    onAddEdge: handleAddEdge,
    onSave: () => void handleSave(),
    onValidate: () => void handleValidate(),
    onRun: () => void handleRun(),
    onReset: handleReset,
    onDelete: handleDelete,
    onExport: handleExport,
    busyAction,
    hasSelection: Boolean(selectedNodeId || selectedEdgeId)
  };

  return (
    <div
      className={cn(
        "min-h-0 overflow-hidden",
        fullScreen
          ? "fixed inset-0 z-50 h-dvh bg-surface-dark/95 p-3 backdrop-blur-xl"
          : "h-[calc(100dvh-5rem)] md:h-[calc(100dvh-2rem)]"
      )}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-primary/12 text-primary-soft">
              <Workflow className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{activeWorkflow.name}</p>
              <p className="truncate text-xs text-muted">
                {isDirty ? "Unsaved changes" : lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : "Blocker · Budget · Drift stop conditions"}
              </p>
            </div>
            <StatusBadge status={activeWorkflow.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={<CirclePlus className="h-4 w-4" />} onClick={handleAddNode}>
              Add node
            </Button>
            <Button variant="secondary" size="sm" icon={<ShieldCheck className="h-4 w-4" />} onClick={() => void handleValidate()} disabled={busyAction !== null}>
              {busyAction === "validate" ? "Validating" : "Validate"}
            </Button>
            <Button variant="secondary" size="sm" icon={<Save className="h-4 w-4" />} onClick={handleSave} disabled={busyAction !== null}>
              {busyAction === "save" ? "Saving" : "Save template"}
            </Button>
            <Button variant="primary" size="sm" icon={<Play className="h-4 w-4" />} onClick={handleRun} disabled={busyAction !== null}>
              {busyAction === "run" ? "Running" : "Run workflow"}
            </Button>
          </div>
        </div>

        {notice ? (
          <p className={cn(
            "rounded-card border px-4 py-2 text-sm",
            notice.tone === "error" ? "border-danger/25 bg-danger/10 text-danger" : "border-success/25 bg-success/10 text-success"
          )}>
            {notice.message}
          </p>
        ) : null}
        {validationErrors.length ? (
          <div className="rounded-card border border-danger/25 bg-danger/10 px-4 py-2 text-sm text-danger">
            {validationErrors.map((error) => <p key={error}>{error}</p>)}
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="custom-scrollbar min-h-0 min-w-0 overflow-auto">
            <WorkflowGraph fill editable showFullScreenToggle toolbarActions={toolbarActions} />
          </div>
          <NodePropertiesPanel className="h-full" />
        </div>

        <div className="shrink-0">
          <WorkflowStatusBar workflow={activeWorkflow} />
        </div>
      </div>
    </div>
  );
}
