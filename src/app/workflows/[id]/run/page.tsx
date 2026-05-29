"use client";

import { CheckCircle2, Pause, Play, Square, UserCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BudgetMeter } from "@/components/workflow/BudgetMeter";
import { TokenCostMeter } from "@/components/workflow/TokenCostMeter";
import { WorkflowGraph } from "@/components/workflow/WorkflowGraph";
import { critiqueIssues } from "@/lib/mock-data";
import { formatCurrency, formatTokens } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";

const logs = [
  "14:18:02 requirement-lock completed: contract hash mock-8ad2",
  "14:21:40 chatgpt-designer emitted UI architecture proposal",
  "14:28:11 gemini-architect started bounded-context review",
  "14:31:56 budget-manager checkpoint: workflow spend at 51%",
  "14:36:03 claude-critic queued for drift and severity audit"
];

const messages = [
  ["Requirement Lock", "Original motive locked. Non-negotiables and out-of-scope items have been extracted."],
  ["ChatGPT Designer", "Recommended a workflow-first command center with chat and compare as capture surfaces."],
  ["Gemini Architect", "Validating route structure, store slices, and service abstractions for future Nest.js handoff."],
  ["Claude Critic", "Pending strict audit for drift, missing states, and acceptance coverage."]
];

export default function WorkflowRunPage({ params }: { params: { id: string } }) {
  const workflows = useWorkflowStore((state) => state.workflows);
  const pauseWorkflow = useWorkflowStore((state) => state.pauseWorkflowMock);
  const runWorkflow = useWorkflowStore((state) => state.runWorkflowMock);
  const stopWorkflow = useWorkflowStore((state) => state.stopWorkflowMock);
  const workflow = workflows.find((item) => item.id === params.id);
  if (!workflow) notFound();

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{workflow.name}</p>
          <p className="truncate text-xs text-muted">Iteration {workflow.iteration} of {workflow.maxIterations} · {workflow.currentNodeId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={workflow.status} />
          <Button size="sm" variant="secondary" icon={<Pause className="h-4 w-4" />} onClick={() => pauseWorkflow(workflow.id)}>Pause</Button>
          <Button size="sm" variant="danger" icon={<Square className="h-4 w-4" />} onClick={() => stopWorkflow(workflow.id)}>Stop</Button>
          <Button size="sm" variant="primary" icon={<Play className="h-4 w-4" />} onClick={() => runWorkflow(workflow.id)}>Resume</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <GlassCard>
          <p className="text-sm text-muted">Iteration count</p>
          <p className="mt-2 text-2xl font-bold text-white">{workflow.iteration}/{workflow.maxIterations}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-muted">Token meter</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatTokens(workflow.totalTokens)}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-muted">Cost meter</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(workflow.totalCost)}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-muted">Current active node</p>
          <p className="mt-2 truncate text-2xl font-bold text-white">{workflow.currentNodeId}</p>
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 overflow-x-auto">
          <WorkflowGraph compact />
        </div>
        <div className="space-y-6">
          <GlassCard>
            <h2 className="text-lg font-semibold text-white">Claude Verdict</h2>
            <p className="mt-3 rounded-card border border-warning/25 bg-warning/10 p-3 text-sm leading-6 text-slate-200">{workflow.claudeVerdict}</p>
          </GlassCard>
          <GlassCard>
            <h2 className="text-lg font-semibold text-white">Meters</h2>
            <div className="mt-4 space-y-4">
              <BudgetMeter used={workflow.totalCost} limit={75} />
              <TokenCostMeter tokens={workflow.totalTokens} cost={workflow.totalCost} />
            </div>
          </GlassCard>
          <GlassCard>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <UserCheck className="h-5 w-5 text-warning" /> Human Approval
            </h2>
            <p className="mt-2 text-sm text-muted">Checkpoint requires approval before final artifact export.</p>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" variant="success" icon={<CheckCircle2 className="h-4 w-4" />}>Approve</Button>
              <Button className="flex-1" variant="secondary">Request changes</Button>
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Agent Messages</h2>
          <div className="mt-4 space-y-3">
            {messages.map(([agent, text]) => (
              <div key={agent} className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
                <p className="font-semibold text-white">{agent}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Execution Logs</h2>
          <div className="mt-4 space-y-2 font-mono text-xs text-slate-300">
            {logs.map((log) => (
              <p key={log} className="rounded-button bg-black/20 px-3 py-2">{log}</p>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Issues by Severity</h2>
          <div className="mt-4 space-y-3">
            {critiqueIssues.map((issue) => (
              <div key={issue.id} className="flex items-center justify-between gap-3 rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
                <span className="text-sm text-slate-300">{issue.title}</span>
                <StatusBadge status={issue.severity} />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
