"use client";

import { Building2, Check, ChevronDown, CreditCard, Keyboard, Plus, Settings, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { PopoverMenu } from "@/components/shared/PopoverMenu";
import { Tooltip } from "@/components/shared/Tooltip";
import { cn, formatCurrency, formatTokens } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";
import { useUiStore } from "@/store/ui-store";

export function WorkspaceSwitcher({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const allWorkspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace);
  const setPageLoading = useUiStore((state) => state.setPageLoading);
  const workspaces = useMemo(() => allWorkspaces.filter((workspace) => !workspace.archived), [allWorkspaces]);
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0];

  const navigate = (path: string, close: () => void) => {
    setPageLoading(true);
    router.push(path);
    close();
    onNavigate?.();
  };

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
      {(close) => (
        <div>
          <div className="rounded-card border border-primary/20 bg-primary/10 p-3">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-button bg-primary text-white shadow-glow">
                <Building2 className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{activeWorkspace?.name ?? "Workspace"}</p>
                  <span className="rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-success">Pro</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">{activeWorkspace?.description ?? "Current A.L.F.R.E.D. workspace"}</p>
              </div>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-button px-2.5 py-2 text-left text-sm text-slate-300 transition hover:bg-white/7 hover:text-white"
                onClick={() => {
                  setActiveWorkspace(workspace.id);
                  close();
                  onNavigate?.();
                }}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/7 text-xs font-semibold text-primary-soft">{workspace.name.slice(0, 1)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{workspace.name}</span>
                  <span className="block truncate text-[11px] text-muted">{workspace.stats.projects} projects · {workspace.stats.chats} chats</span>
                </span>
                {workspace.id === activeWorkspaceId ? <Check className="h-4 w-4 text-success" /> : null}
              </button>
            ))}
          </div>

          <div className="mt-2 border-t border-surface-darkBorder pt-2">
            {[
              { label: "Manage workspaces", icon: Building2, href: "/workspaces" },
              { label: "Create workspace", icon: Plus, href: "/workspaces/new" },
              { label: "Workspace settings", icon: Settings, href: `/workspaces/${activeWorkspaceId}/settings` },
              { label: "Billing/usage", icon: CreditCard, href: "/billing" },
              { label: "Keyboard shortcuts", icon: Keyboard, href: "/keyboard-shortcuts" }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-button px-2.5 py-2 text-left text-sm text-slate-300 transition hover:bg-white/7 hover:text-white"
                  onClick={() => {
                    navigate(item.href, close);
                  }}
                >
                  <Icon className="h-4 w-4 text-muted" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </PopoverMenu>
  );
}
