"use client";

import { CirclePlus, Play, Save, Workflow } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { NodePropertiesPanel } from "@/components/workflow/NodePropertiesPanel";
import { WorkflowGraph } from "@/components/workflow/WorkflowGraph";
import { WorkflowStatusBar } from "@/components/workflow/WorkflowStatusBar";
import { workflows } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import { useWorkflowStore } from "@/store/workflow-store";

export default function AgentStudioPage() {
  const activeWorkflow = workflows[0];
  const fullScreen = useUiStore((state) => state.fullScreenPage) === "agent-studio";
  const runWorkflow = useWorkflowStore((state) => state.runWorkflowMock);
  const [notice, setNotice] = useState("");
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1600);
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
              <p className="truncate text-sm font-semibold text-white">Claude Critic Loop</p>
              <p className="truncate text-xs text-muted">Blocker · Budget · Drift stop conditions</p>
            </div>
            <StatusBadge status={activeWorkflow.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={<CirclePlus className="h-4 w-4" />} onClick={() => showNotice("Mock node added to the draft template.")}>
              Add node
            </Button>
            <Button variant="secondary" size="sm" icon={<Save className="h-4 w-4" />} onClick={() => showNotice("Workflow template saved locally.")}>
              Save template
            </Button>
            <Button variant="primary" size="sm" icon={<Play className="h-4 w-4" />} onClick={() => { runWorkflow(activeWorkflow.id); showNotice("Mock workflow run started."); }}>
              Run workflow
            </Button>
          </div>
        </div>

        {notice ? <p className="rounded-card border border-success/25 bg-success/10 px-4 py-2 text-sm text-success">{notice}</p> : null}

        <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="custom-scrollbar min-h-0 min-w-0 overflow-auto">
            <WorkflowGraph fill showFullScreenToggle />
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
