"use client";

import { Building2, ChevronRight } from "lucide-react";
import { AppLink } from "@/components/shared/AppLink";
import { cn, formatCurrency, formatTokens } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";

export function WorkspaceSwitcher({
  collapsed = false,
  onNavigate,
  active = false
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  active?: boolean;
}) {
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const workspace = workspaces.find((item) => item.id === activeWorkspaceId) ?? workspaces[0];

  if (collapsed) {
    return (
      <AppLink
        href="/workspaces"
        title={workspace?.name ?? "Workspaces"}
        onClick={onNavigate}
        className={cn(
          "grid h-10 w-full place-items-center rounded-button text-slate-300 transition hover:bg-white/7 hover:text-white",
          active && "bg-primary/12 text-white"
        )}
      >
        <Building2 className="h-4 w-4" />
      </AppLink>
    );
  }

  return (
    <AppLink
      href="/workspaces"
      onClick={onNavigate}
      className={cn(
        "block rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3 transition hover:-translate-y-px hover:border-primary/40 hover:bg-surface-darkElevated",
        active && "border-primary/35 bg-primary/10"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-button bg-primary/12 text-primary-soft">
          <Building2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{workspace?.name ?? "Workspace"}</p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {formatTokens(workspace?.stats.tokenUsage ?? 0)} tokens · {formatCurrency(workspace?.stats.cost ?? 0)}
          </p>
        </div>
        <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted" />
      </div>
    </AppLink>
  );
}
