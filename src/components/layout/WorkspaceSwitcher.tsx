"use client";

import { ChevronDown, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { PopoverMenu } from "@/components/shared/PopoverMenu";
import { Tooltip } from "@/components/shared/Tooltip";
import { cn, formatCurrency, formatTokens } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";

const WorkspaceSwitcherPanel = dynamic(() => import("./WorkspaceSwitcherPanel").then((mod) => mod.WorkspaceSwitcherPanel), {
  ssr: false,
  loading: () => <div className="h-56 rounded-card bg-white/5" />
});

export function WorkspaceSwitcher({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const allWorkspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const workspaces = useMemo(() => allWorkspaces.filter((workspace) => !workspace.archived), [allWorkspaces]);
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0];

  const trigger = (open: boolean) => {
    const content = collapsed ? (
      <span className={cn("grid h-10 w-10 place-items-center rounded-button bg-primary/12 text-primary-soft transition hover:bg-primary/18", open && "bg-primary/20 text-white")}>
        <Sparkles className="h-4 w-4" />
      </span>
    ) : (
      <span className={cn("flex w-full items-center gap-3 rounded-card border border-surface-darkBorder bg-surface-darkElevated/55 p-2.5 transition hover:border-primary/40 hover:bg-surface-darkElevated", open && "border-primary/40 bg-primary/10")}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-button bg-primary/12 text-primary-soft">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">{activeWorkspace?.name ?? "Workspace"}</span>
          <span className="block truncate text-xs text-muted">
            {formatTokens(activeWorkspace?.stats.tokenUsage ?? 0)} tokens · {formatCurrency(activeWorkspace?.stats.cost ?? 0)}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition", open && "rotate-180 text-white")} />
      </span>
    );
    return collapsed ? <Tooltip label={activeWorkspace?.name ?? "Workspace"}>{content}</Tooltip> : content;
  };

  return (
    <PopoverMenu
      ariaLabel="Open workspace switcher"
      placement={collapsed ? "right" : "bottom"}
      className={collapsed ? "grid place-items-center" : "w-full"}
      triggerClassName={collapsed ? "grid place-items-center" : ""}
      panelClassName="w-[300px] sm:w-80"
      trigger={trigger}
    >
      {(close) => <WorkspaceSwitcherPanel close={close} onNavigate={onNavigate} />}
    </PopoverMenu>
  );
}
