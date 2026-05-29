import { formatCurrency, percent } from "@/lib/utils";

export function BudgetMeter({ used, limit }: { used: number; limit: number }) {
  const value = percent(used, limit);
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-muted">Budget</span>
        <span className="font-semibold text-white">{formatCurrency(used)} / {formatCurrency(limit)}</span>
      </div>
      <div className="h-2 rounded-full bg-surface-darkElevated">
        <div className="h-2 rounded-full bg-gradient-to-r from-primary to-warning" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
