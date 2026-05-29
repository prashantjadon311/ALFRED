import { Check, RefreshCw, Timer } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { formatCurrency, formatTokens } from "@/lib/utils";

interface CompareResponse {
  model: string;
  provider: string;
  response: string;
  tokens: number;
  cost: number;
  latency: number;
}

export function ModelResponsePane({
  item,
  selected,
  onPick,
  onRegenerate
}: {
  item: CompareResponse;
  selected?: boolean;
  onPick?: () => void;
  onRegenerate?: () => void;
}) {
  return (
    <GlassCard className={`flex min-h-[22rem] flex-col p-4 ${selected ? "border-success/40 shadow-glow" : ""}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white">{item.model}</h3>
          <p className="truncate text-sm text-muted">{item.provider}</p>
        </div>
        <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary-soft">
          {formatTokens(item.tokens)}
        </span>
      </div>
      <div className="custom-scrollbar min-h-[8rem] flex-1 overflow-y-auto rounded-card border border-surface-darkBorder/70 bg-black/10 p-3">
        <p className="text-sm leading-6 text-slate-300">{item.response}</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-card bg-black/15 p-2.5">
          <p className="text-muted">Cost</p>
          <p className="mt-1 font-semibold text-white">{formatCurrency(item.cost)}</p>
        </div>
        <div className="rounded-card bg-black/15 p-2.5">
          <p className="text-muted">Latency</p>
          <p className="mt-1 flex items-center gap-1 font-semibold text-white">
            <Timer className="h-3 w-3" /> {item.latency}s
          </p>
        </div>
        <div className="rounded-card bg-black/15 p-2.5">
          <p className="text-muted">Provider</p>
          <p className="mt-1 truncate font-semibold text-white">{item.provider}</p>
        </div>
      </div>
      {selected ? <p className="mt-3 rounded-card border border-success/25 bg-success/10 px-3 py-2 text-xs font-semibold text-success">Selected as current best response.</p> : null}
      <div className="mt-3 flex gap-2">
        <Button className="flex-1" size="sm" variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={onRegenerate}>
          Regenerate
        </Button>
        <Button className="flex-1" size="sm" variant="success" icon={<Check className="h-4 w-4" />} onClick={onPick}>
          Pick best
        </Button>
      </div>
    </GlassCard>
  );
}
