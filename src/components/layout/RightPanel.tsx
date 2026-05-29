import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function RightPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <aside className={cn("glass-panel rounded-panel p-5", className)}>{children}</aside>;
}
