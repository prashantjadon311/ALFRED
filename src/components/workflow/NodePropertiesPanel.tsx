"use client";

import { Power } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { agentNodes } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";

export function NodePropertiesPanel({ className }: { className?: string }) {
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const node = agentNodes.find((item) => item.id === selectedNodeId) ?? agentNodes[0];

  return (
    <aside className={cn("glass-panel flex min-h-0 flex-col rounded-panel p-4", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">Node Properties</h2>
          <p className="text-sm text-muted">{node.role}</p>
        </div>
        <StatusBadge status={node.status} />
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Agent name</span>
          <input className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" defaultValue={node.title} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Provider</span>
            <input className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" defaultValue={node.provider} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Model</span>
            <input className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" defaultValue={node.model} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">System prompt</span>
          <textarea className="min-h-32 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated p-3 text-sm leading-6 text-white" defaultValue={node.systemPrompt} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-1 block text-xs text-muted">Temperature</span>
            <input type="number" step="0.1" className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" defaultValue={0.4} />
          </label>
          <label>
            <span className="mb-1 block text-xs text-muted">Max tokens</span>
            <input className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" defaultValue={12000} />
          </label>
          <label>
            <span className="mb-1 block text-xs text-muted">Budget limit</span>
            <input className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" defaultValue="$25" />
          </label>
          <label>
            <span className="mb-1 block text-xs text-muted">Retry policy</span>
            <select className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" defaultValue="2 retries">
              <option>0 retries</option>
              <option>1 retry</option>
              <option>2 retries</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Stop conditions</span>
          <input className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" defaultValue="Blocker issue, budget breach, human rejection" />
        </label>
        <div className="flex items-center justify-between rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
          <span className="text-sm font-medium text-slate-200">Node enabled</span>
          <Button size="sm" variant="success" icon={<Power className="h-4 w-4" />}>
            Enabled
          </Button>
        </div>
      </div>
    </aside>
  );
}
