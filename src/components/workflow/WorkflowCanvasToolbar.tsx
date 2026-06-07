"use client";

import { Download, GitBranchPlus, Maximize, Play, Plus, RotateCcw, Save, ShieldCheck, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { Button } from "@/components/shared/Button";
import { FullScreenToggle } from "@/components/shared/FullScreenToggle";

export type WorkflowToolbarActions = {
  onAddNode: () => void;
  onAddEdge: () => void;
  onSave: () => void;
  onValidate: () => void;
  onRun: () => void;
  onReset: () => void;
  onDelete: () => void;
  onExport: () => void;
  busyAction?: "save" | "run" | "validate" | null;
  hasSelection?: boolean;
};

export function WorkflowCanvasToolbar({
  showFullScreenToggle = false,
  actions
}: {
  showFullScreenToggle?: boolean;
  actions?: WorkflowToolbarActions;
}) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  return (
    <div className="glass-panel absolute left-4 top-4 z-10 flex flex-wrap gap-2 rounded-card p-2">
      {actions ? (
        <Button size="sm" variant="primary" icon={<Play className="h-4 w-4" />} onClick={actions.onRun} disabled={Boolean(actions.busyAction)}>
          Run workflow
        </Button>
      ) : null}
      <Button size="icon" variant="secondary" aria-label="Zoom in" title="Zoom in" onClick={() => void zoomIn()}>
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="secondary" aria-label="Zoom out" title="Zoom out" onClick={() => void zoomOut()}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="secondary" aria-label="Fit view" title="Fit view" onClick={() => void fitView({ padding: 0.15 })}>
        <Maximize className="h-4 w-4" />
      </Button>
      {showFullScreenToggle ? <FullScreenToggle page="agent-studio" /> : null}
      {actions ? (
        <>
          <Button size="icon" variant="secondary" aria-label="Save template" title="Save template" onClick={actions.onSave} disabled={Boolean(actions.busyAction)}>
            <Save className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" aria-label="Validate workflow" title="Validate workflow" onClick={actions.onValidate} disabled={Boolean(actions.busyAction)}>
            <ShieldCheck className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" aria-label="Add node" title="Add AI agent node" onClick={actions.onAddNode}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" aria-label="Add edge" title="Connect selected node to another node" onClick={actions.onAddEdge}>
            <GitBranchPlus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="danger" aria-label="Delete selected element" title="Delete selected node or edge" onClick={actions.onDelete} disabled={!actions.hasSelection}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" aria-label="Reset workflow" title="Reset workflow" onClick={actions.onReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" aria-label="Export workflow" title="Export workflow JSON" onClick={actions.onExport}>
            <Download className="h-4 w-4" />
          </Button>
        </>
      ) : null}
    </div>
  );
}
