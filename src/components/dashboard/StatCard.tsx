import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  detail,
  icon,
  tone = "primary"
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const tones = {
    primary: "bg-primary/15 text-primary-soft",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger"
  };

  return (
    <GlassCard className="group min-h-36">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("grid h-10 w-10 place-items-center rounded-card", tones[tone])}>{icon}</div>
        <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
      </div>
      <p className="mt-5 text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{detail}</p>
    </GlassCard>
  );
}
