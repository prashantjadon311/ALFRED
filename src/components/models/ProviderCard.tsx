"use client";

import { KeyRound, PlugZap, Settings, ShieldCheck, TestTube2 } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { ModelProvider } from "@/lib/types";
import { formatCurrency, providerAccent } from "@/lib/utils";
import { ApiKeyInputMasked } from "./ApiKeyInputMasked";

export function ProviderCard({
  provider,
  onToggle,
  onTest,
  testMessage
}: {
  provider: ModelProvider;
  onToggle?: () => void;
  onTest?: () => void;
  testMessage?: string;
}) {
  const healthWidth = provider.health === "Healthy" ? "100%" : provider.health === "Degraded" ? "62%" : "18%";

  return (
    <GlassCard className={`relative overflow-hidden bg-gradient-to-br ${providerAccent(provider.name)}`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-success to-warning" />
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-card bg-black/20 text-white">
            <PlugZap className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold text-white">{provider.name}</h3>
            <p className="max-w-44 truncate text-xs text-muted">{provider.baseUrl}</p>
          </div>
        </div>
        <StatusBadge status={provider.health} />
      </div>
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>Mock provider health</span>
          <span>{provider.enabled ? "enabled" : "disabled"}</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-darkElevated">
          <div className="h-1.5 rounded-full bg-gradient-to-r from-primary to-success" style={{ width: healthWidth }} />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-card border border-surface-darkBorder bg-black/15 p-3">
          <span className="text-sm text-slate-300">Enabled</span>
          <button
            onClick={onToggle}
            aria-label={`Toggle ${provider.name}`}
            className={`h-6 w-11 rounded-full p-1 transition ${provider.enabled ? "bg-success" : "bg-surface-darkBorder"}`}
          >
            <span className={`block h-4 w-4 rounded-full bg-white transition ${provider.enabled ? "translate-x-5" : ""}`} />
          </button>
        </div>
        <div>
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            <KeyRound className="h-3.5 w-3.5" /> Masked key
          </p>
          <ApiKeyInputMasked value={provider.maskedApiKey} />
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Default model</span>
          <input className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" defaultValue={provider.defaultModel} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Base URL</span>
          <input className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" defaultValue={provider.baseUrl} />
        </label>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-card bg-black/15 p-3">
            <p className="text-muted">Input</p>
            <p className="font-semibold text-white">{formatCurrency(provider.inputCost)}/M</p>
          </div>
          <div className="rounded-card bg-black/15 p-3">
            <p className="text-muted">Output</p>
            <p className="font-semibold text-white">{formatCurrency(provider.outputCost)}/M</p>
          </div>
          <div className="rounded-card bg-black/15 p-3">
            <p className="text-muted">Limit</p>
            <p className="truncate font-semibold text-white">{provider.rateLimit}</p>
          </div>
        </div>
        {testMessage ? <p className="rounded-card border border-success/20 bg-success/10 p-3 text-xs text-success">{testMessage}</p> : null}
        <div className="flex gap-2">
          <Button className="flex-1" variant="secondary" icon={<TestTube2 className="h-4 w-4" />} onClick={onTest}>Test mocked</Button>
          <Button className="flex-1" variant="secondary" icon={<Settings className="h-4 w-4" />}>Configure</Button>
        </div>
        <p className="flex items-center gap-2 rounded-card border border-success/20 bg-success/10 p-3 text-xs leading-5 text-slate-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-success" /> No real API key validation or network execution is performed.
        </p>
      </div>
    </GlassCard>
  );
}
