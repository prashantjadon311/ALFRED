"use client";

import { Play, Workflow } from "lucide-react";
import { useEffect } from "react";
import { AppLink } from "@/components/shared/AppLink";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatTokens } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";

export default function WorkflowsPage() {
  const workflows = useWorkflowStore((state) => state.workflows);
  const loadWorkflows = useWorkflowStore((state) => state.loadFromApi);
  const runWorkflow = useWorkflowStore((state) => state.runWorkflowMock);
  useEffect(() => {
    void loadWorkflows();
  }, [loadWorkflows]);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" variant="primary" icon={<Workflow className="h-4 w-4" />}>New workflow</Button>
      </div>

      <GlassCard>
        <div className="grid gap-3 md:hidden">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{workflow.name}</p>
                  <p className="mt-1 text-xs text-muted">{workflow.projectId}</p>
                </div>
                <StatusBadge status={workflow.status} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-300">
                <span>{workflow.iteration}/{workflow.maxIterations} iter</span>
                <span>{formatTokens(workflow.totalTokens)}</span>
                <span>{formatCurrency(workflow.totalCost)}</span>
              </div>
              <AppLink href={`/workflows/${workflow.id}/run`} className="mt-4 block">
                <Button className="w-full" size="sm" variant="secondary" icon={<Play className="h-4 w-4" />} onClick={() => runWorkflow(workflow.id)}>Open run</Button>
              </AppLink>
            </div>
          ))}
        </div>
        <div className="custom-scrollbar hidden overflow-x-auto md:block">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-3 py-3">Run name</th>
                <th className="px-3 py-3">Project</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Iterations</th>
                <th className="px-3 py-3">Models used</th>
                <th className="px-3 py-3">Tokens</th>
                <th className="px-3 py-3">Cost</th>
                <th className="px-3 py-3">Started at</th>
                <th className="px-3 py-3">Duration</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-darkBorder">
              {workflows.map((workflow) => (
                <tr key={workflow.id} className="hover:bg-white/5">
                  <td className="px-3 py-4 font-semibold text-white">{workflow.name}</td>
                  <td className="px-3 py-4 text-slate-300">{workflow.projectId}</td>
                  <td className="px-3 py-4"><StatusBadge status={workflow.status} /></td>
                  <td className="px-3 py-4 text-slate-300">{workflow.iteration}/{workflow.maxIterations}</td>
                  <td className="px-3 py-4 text-slate-300">GPT-5, Claude, Gemini</td>
                  <td className="px-3 py-4 text-slate-300">{formatTokens(workflow.totalTokens)}</td>
                  <td className="px-3 py-4 text-slate-300">{formatCurrency(workflow.totalCost)}</td>
                  <td className="px-3 py-4 text-slate-300">{workflow.startedAt.slice(0, 10)}</td>
                  <td className="px-3 py-4 text-slate-300">{workflow.duration}</td>
                  <td className="px-3 py-4">
                    <AppLink href={`/workflows/${workflow.id}/run`}>
                      <Button size="sm" variant="secondary" icon={<Play className="h-4 w-4" />}>Open run</Button>
                    </AppLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
