"use client";

import { Bot, BrainCircuit, CircleDollarSign, Clock3, FolderKanban, Gauge, MessageSquarePlus, Settings, ShieldAlert, Workflow } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { MiniUsageChart } from "@/components/dashboard/MiniUsageChart";
import { ProviderHealthCard } from "@/components/dashboard/ProviderHealthCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { agentNodes, providerCosts, providers, workflows } from "@/lib/mock-data";
import { formatCurrency, formatTokens } from "@/lib/utils";

const loop = ["User Input", "Requirement Lock", "ChatGPT", "Gemini", "Consensus", "Claude Critic", "Final Output"];
const loopStatuses = ["Completed", "Completed", "Completed", "Running", "Queued", "Guarded", "Queued"];

export default function DashboardPage() {
  const activeRuns = workflows.filter((workflow) => workflow.status === "Running" || workflow.status === "Waiting Approval");

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" icon={<Settings className="h-4 w-4" />}>
          Configure
        </Button>
        <Button variant="primary" size="sm" icon={<Workflow className="h-4 w-4" />}>
          New Run
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total Projects" value="5" detail="+2 active this week" icon={<FolderKanban className="h-5 w-5" />} />
        <StatCard label="Active Agent Runs" value="2" detail="1 waiting approval" icon={<Bot className="h-5 w-5" />} tone="success" />
        <StatCard label="Monthly Tokens" value={formatTokens(3_859_350)} detail="71% input / 29% output" icon={<Gauge className="h-5 w-5" />} />
        <StatCard label="Estimated Cost" value={formatCurrency(749.55)} detail="81% monthly budget" icon={<CircleDollarSign className="h-5 w-5" />} tone="warning" />
        <StatCard label="Waiting Approvals" value="3" detail="human checkpoints" icon={<Clock3 className="h-5 w-5" />} tone="warning" />
        <StatCard label="Failed Runs" value="1" detail="service inventory blocker" icon={<ShieldAlert className="h-5 w-5" />} tone="danger" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_.9fr]">
        <GlassCard className="overflow-hidden p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Active Agent Loop</h2>
              <p className="text-sm text-muted">Requirement-locked multi-model execution path.</p>
            </div>
            <StatusBadge status="Running" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
            {loop.map((step, index) => (
              <div key={step} className="relative min-h-[118px] rounded-card border border-surface-darkBorder bg-surface-darkElevated/70 p-3.5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-primary-soft">0{index + 1}</span>
                  <StatusBadge status={loopStatuses[index]} />
                </div>
                <p className="text-sm font-semibold leading-5 text-white">{step}</p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  {index < 2 ? "Motive and constraints locked." : index < 5 ? "Agent handoff captured." : "Governance checkpoint."}
                </p>
                {step === "Gemini" ? <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-success shadow-[0_0_20px_rgba(34,197,94,.8)]" /> : null}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <p className="mt-1 text-sm text-muted">Live-style audit trail from mocked services.</p>
          <div className="mt-4">
            <ActivityTimeline />
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Usage Trend</h2>
          <p className="mb-4 text-sm text-muted">Daily input/output token volume.</p>
          <MiniUsageChart />
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Cost by Provider</h2>
          <p className="mb-4 text-sm text-muted">Estimated spend from mocked token accounting.</p>
          <div className="space-y-4">
            {providerCosts.map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{item.name}</span>
                  <span className="font-semibold text-white">{formatCurrency(item.value)}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-darkElevated">
                  <div className="h-2 rounded-full bg-gradient-to-r from-primary to-success" style={{ width: `${Math.max(6, (item.value / 180) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Active Workflows</h2>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {activeRuns.map((workflow) => (
              <GlassCard key={workflow.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{workflow.name}</h3>
                    <p className="mt-1 text-sm text-muted">Iteration {workflow.iteration} of {workflow.maxIterations}</p>
                  </div>
                  <StatusBadge status={workflow.status} />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
                  <div className="rounded-card bg-black/15 p-3">
                    <p className="text-muted">Tokens</p>
                    <p className="mt-1 font-semibold text-white">{formatTokens(workflow.totalTokens)}</p>
                  </div>
                  <div className="rounded-card bg-black/15 p-3">
                    <p className="text-muted">Cost</p>
                    <p className="mt-1 font-semibold text-white">{formatCurrency(workflow.totalCost)}</p>
                  </div>
                  <div className="rounded-card bg-black/15 p-3">
                    <p className="text-muted">Node</p>
                    <p className="mt-1 truncate font-semibold text-white">{workflow.currentNodeId}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-300">{workflow.claudeVerdict}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <QuickActionCard title="New Chat" description="Open a governed playground session." href="/playground" icon={<MessageSquarePlus className="h-5 w-5" />} />
            <QuickActionCard title="New Agentic Run" description="Start a requirement-locked workflow." href="/agent-studio" icon={<Workflow className="h-5 w-5" />} />
            <QuickActionCard title="Create Project" description="Capture goals, memory, and linked runs." href="/projects" icon={<FolderKanban className="h-5 w-5" />} />
            <QuickActionCard title="Configure Model" description="Manage providers and routing defaults." href="/models" icon={<BrainCircuit className="h-5 w-5" />} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {providers.slice(0, 4).map((provider) => (
          <ProviderHealthCard key={provider.id} provider={provider} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {agentNodes.slice(2, 6).map((node) => (
          <GlassCard key={node.id} className="min-h-36">
            <StatusBadge status={node.status} />
            <h3 className="mt-4 font-semibold text-white">{node.title}</h3>
            <p className="mt-2 text-sm text-muted">{node.role}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
