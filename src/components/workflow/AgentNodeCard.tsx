"use client";

import { Bot, CheckCircle2, CircleAlert, Clock3, Pause, Play, Settings, Zap } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { AgentNode } from "@/lib/types";
import { cn, formatCurrency, formatTokens } from "@/lib/utils";

const statusIcon = {
  Pending: Clock3,
  Running: Play,
  Success: CheckCircle2,
  Failed: CircleAlert,
  Waiting: Clock3,
  Paused: Pause,
  "Needs Approval": CircleAlert
};

export function AgentNodeCard({ data }: { data: { agent: AgentNode; selected?: boolean } }) {
  const agent = data.agent;
  const Icon = statusIcon[agent.status] ?? Bot;
  const totalTokens = agent.inputTokens + agent.outputTokens;
  return (
    <div
      className={cn(
        "relative w-72 overflow-hidden rounded-card border border-surface-darkBorder bg-surface-darkCard/95 p-4 text-left shadow-card backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-primary/45",
        agent.status === "Running" && "animate-pulse-node shadow-node-active",
        data.selected && "border-primary shadow-node-active"
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-success to-warning" />
      <Handle type="target" position={Position.Top} />
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-card bg-primary/15 text-primary-soft">
          <Icon className="h-4 w-4" />
        </span>
        <StatusBadge status={agent.status} />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-white">{agent.title}</h3>
      <p className="mt-1 text-xs text-muted">{agent.provider} · {agent.model}</p>
      <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-300">{agent.role}</p>
      <div className="mt-4 h-1.5 rounded-full bg-surface-darkElevated">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-primary to-success"
          style={{ width: `${Math.min(100, Math.max(10, totalTokens / 260))}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-button bg-black/18 p-2">
          <p className="text-muted">Tokens</p>
          <p className="font-semibold text-white">{formatTokens(totalTokens)}</p>
        </div>
        <div className="rounded-button bg-black/18 p-2">
          <p className="text-muted">Cost</p>
          <p className="font-semibold text-white">{formatCurrency(agent.cost)}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-warning" /> {agent.latency ? `${agent.latency.toFixed(1)}s` : "idle"}
        </span>
        <span>{agent.role.includes("Critic") ? "strict audit" : "governed"}</span>
      </div>
      <Button className="mt-4 w-full" size="sm" variant="secondary" icon={<Settings className="h-4 w-4" />}>
        Configure
      </Button>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
