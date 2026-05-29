import { Coins, Gauge } from "lucide-react";
import { formatCurrency, formatTokens } from "@/lib/utils";

export function TokenCostMeter({ tokens, cost }: { tokens: number; cost: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
        <p className="flex items-center gap-1 text-xs text-muted">
          <Gauge className="h-3.5 w-3.5" /> Used tokens
        </p>
        <p className="mt-1 text-lg font-semibold text-white">{formatTokens(tokens)}</p>
      </div>
      <div className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
        <p className="flex items-center gap-1 text-xs text-muted">
          <Coins className="h-3.5 w-3.5" /> Total cost
        </p>
        <p className="mt-1 text-lg font-semibold text-white">{formatCurrency(cost)}</p>
      </div>
    </div>
  );
}
