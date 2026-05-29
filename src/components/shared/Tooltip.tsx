"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tooltip({ label, children, side = "right", className }: { label: string; children: ReactNode; side?: "top" | "right" | "bottom"; className?: string }) {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-surface-darkBorder bg-surface-darkElevated px-2 py-1 text-xs text-slate-100 opacity-0 shadow-card transition group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          side === "right" && "left-full top-1/2 ml-2 -translate-y-1/2",
          side === "top" && "bottom-full left-1/2 mb-2 -translate-x-1/2",
          side === "bottom" && "left-1/2 top-full mt-2 -translate-x-1/2"
        )}
      >
        {label}
      </span>
    </span>
  );
}
