import { Activity, Server } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { ModelProvider } from "@/lib/types";
import { providerAccent } from "@/lib/utils";

export function ProviderHealthCard({ provider }: { provider: ModelProvider }) {
  return (
    <GlassCard className={`bg-gradient-to-br ${providerAccent(provider.name)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-card bg-black/20 text-white">
            <Server className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold text-white">{provider.name}</h3>
            <p className="text-xs text-muted">{provider.defaultModel}</p>
          </div>
        </div>
        <StatusBadge status={provider.health} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-card border border-white/8 bg-black/15 p-3">
          <p className="text-muted">Rate limit</p>
          <p className="mt-1 font-semibold text-slate-100">{provider.rateLimit}</p>
        </div>
        <div className="rounded-card border border-white/8 bg-black/15 p-3">
          <p className="text-muted">Mock latency</p>
          <p className="mt-1 flex items-center gap-1 font-semibold text-slate-100">
            <Activity className="h-3.5 w-3.5 text-success" /> 210 ms
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
