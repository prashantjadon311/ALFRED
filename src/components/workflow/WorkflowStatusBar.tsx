import { CircleCheck, ShieldCheck } from "lucide-react";
import { BudgetMeter } from "./BudgetMeter";
import { TokenCostMeter } from "./TokenCostMeter";
import type { WorkflowRun } from "@/lib/types";

export function WorkflowStatusBar({ workflow }: { workflow: WorkflowRun }) {
  return (
    <div className="glass-panel grid gap-4 rounded-panel p-4 lg:grid-cols-[1fr_1fr_1.4fr_1.2fr]">
      <div className="rounded-card bg-surface-darkElevated/60 p-3">
        <p className="text-xs text-muted">Current iteration</p>
        <p className="mt-1 text-lg font-semibold text-white">{workflow.iteration} / {workflow.maxIterations}</p>
      </div>
      <BudgetMeter used={workflow.totalCost} limit={75} />
      <TokenCostMeter tokens={workflow.totalTokens} cost={workflow.totalCost} />
      <div className="rounded-card border border-primary/25 bg-primary/10 p-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-soft">
          <ShieldCheck className="h-4 w-4" /> Last Claude verdict
        </p>
        <p className="mt-2 text-sm leading-5 text-slate-200">{workflow.claudeVerdict}</p>
        <p className="mt-2 flex items-center gap-1 text-xs text-success">
          <CircleCheck className="h-3.5 w-3.5" /> Active node: {workflow.currentNodeId}
        </p>
      </div>
    </div>
  );
}
