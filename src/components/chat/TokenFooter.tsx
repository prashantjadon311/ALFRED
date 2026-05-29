import { Clock, Coins, Gauge } from "lucide-react";
import type { Message } from "@/lib/types";
import { formatCurrency, formatTokens } from "@/lib/utils";

export function TokenFooter({ message }: { message: Message }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
      <span className="inline-flex items-center gap-1">
        <Gauge className="h-3.5 w-3.5" /> {formatTokens(message.tokens)} tokens
      </span>
      <span className="inline-flex items-center gap-1">
        <Coins className="h-3.5 w-3.5" /> {formatCurrency(message.cost)}
      </span>
      {message.latency > 0 ? (
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {message.latency.toFixed(1)}s
        </span>
      ) : null}
    </div>
  );
}
