import type { ReactNode } from "react";
import { GlassCard } from "./GlassCard";

export function MetricCard({
  label,
  value,
  detail,
  icon
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
}) {
  return (
    <GlassCard className="min-h-32">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
        {icon ? <span className="grid h-10 w-10 place-items-center rounded-card bg-primary/15 text-primary-soft">{icon}</span> : null}
      </div>
      {detail ? <p className="mt-3 text-xs text-slate-400">{detail}</p> : null}
    </GlassCard>
  );
}
