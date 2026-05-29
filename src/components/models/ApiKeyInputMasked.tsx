"use client";

import { EyeOff, KeyRound } from "lucide-react";

export function ApiKeyInputMasked({ value }: { value: string }) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-slate-300">
      <KeyRound className="h-4 w-4 text-muted" />
      <span className="min-w-0 flex-1 truncate">{value}</span>
      <EyeOff className="h-4 w-4 text-muted" />
    </div>
  );
}
