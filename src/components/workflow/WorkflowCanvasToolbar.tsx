"use client";

import { Download, GitBranchPlus, Maximize, Play, Plus, RotateCcw, Save, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { FullScreenToggle } from "@/components/shared/FullScreenToggle";

export function WorkflowCanvasToolbar({ showFullScreenToggle = false }: { showFullScreenToggle?: boolean }) {
  return (
    <div className="glass-panel absolute left-4 top-4 z-10 flex flex-wrap gap-2 rounded-card p-2">
      <Button size="sm" variant="primary" icon={<Play className="h-4 w-4" />}>
        Run workflow
      </Button>
      <Button size="icon" variant="secondary" aria-label="Zoom in">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="secondary" aria-label="Zoom out">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="secondary" aria-label="Fit view">
        <Maximize className="h-4 w-4" />
      </Button>
      {showFullScreenToggle ? <FullScreenToggle page="agent-studio" /> : null}
      <Button size="icon" variant="secondary" aria-label="Save template">
        <Save className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="secondary" aria-label="Add node">
        <Plus className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="secondary" aria-label="Add edge">
        <GitBranchPlus className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="secondary" aria-label="Reset workflow">
        <RotateCcw className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="secondary" aria-label="Export workflow">
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
