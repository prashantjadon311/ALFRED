import { CheckCircle2, LockKeyhole, ShieldCheck, Target, type LucideIcon } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { RequirementContract } from "@/lib/types";

export function RequirementContractCard({
  contract,
  onSave,
  saving = false
}: {
  contract: RequirementContract;
  onSave?: () => void;
  saving?: boolean;
}) {
  const sections: Array<[string, string[], LucideIcon]> = [
    ["Non-negotiables", contract.nonNegotiables, ShieldCheck],
    ["Success criteria", contract.successCriteria, CheckCircle2],
    ["Out of scope", contract.outOfScope, LockKeyhole]
  ];

  return (
    <GlassCard className="neon-border overflow-hidden">
      <div className="mb-5 rounded-panel border border-primary/35 bg-gradient-to-br from-primary/20 via-primary/10 to-success/10 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-soft">
              <LockKeyhole className="h-4 w-4" /> Original motive locked
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">{contract.originalRequirement}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-card border border-success/25 bg-success/10 px-3 py-2 text-xs font-semibold text-success">
              {contract.locked ? "Immutable" : "Draft"}
            </div>
            {onSave ? (
              <Button size="sm" variant="secondary" onClick={onSave} disabled={saving}>
                {saving ? "Saving..." : contract.locked ? "Save contract" : "Save & lock"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Requirement Contract</h2>
          <p className="text-sm text-muted">Locked goal and guardrails for drift detection.</p>
        </div>
        <StatusBadge status={contract.driftStatus} />
      </div>
      <div className="space-y-5">
        <section>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Target className="h-4 w-4 text-success" /> Locked goal
          </p>
          <p className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-4 text-sm leading-6 text-slate-300">{contract.lockedGoal}</p>
        </section>
        {sections.map(([title, items, Icon]) => (
          <section key={title}>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <Icon className="h-4 w-4 text-primary-soft" /> {title}
            </p>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item} className="flex gap-2 rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 px-3 py-2 text-sm leading-6 text-slate-300">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-xs text-muted">Contract id {contract.id}</p>
      </div>
    </GlassCard>
  );
}
