import type { BudgetRule } from "@/lib/types";
import { formatCurrency, percent } from "@/lib/utils";

export function BudgetProgress({ rule }: { rule: BudgetRule }) {
  const value = percent(rule.used, rule.limit);
  const bar = value >= 90 ? "from-danger to-warning" : value >= 75 ? "from-warning to-primary" : "from-primary to-success";

  return (
    <div className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-4 transition hover:-translate-y-0.5 hover:border-primary/35">
      <div className="mb-2 flex justify-between gap-3 text-sm">
        <div>
          <p className="font-semibold text-white">{rule.label}</p>
          <p className="text-xs text-muted">{rule.scope}</p>
        </div>
        <span className="font-semibold text-white">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-dark">
        <div className={`h-2 rounded-full bg-gradient-to-r ${bar}`} style={{ width: `${value}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">{formatCurrency(rule.used)} used of {formatCurrency(rule.limit)}</p>
    </div>
  );
}
