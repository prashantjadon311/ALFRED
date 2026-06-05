"use client";

import { WalletCards } from "lucide-react";
import { Tooltip } from "@/components/shared/Tooltip";
import { cn, formatCurrency, formatTokens } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";

export function SidebarUsageCard({ collapsed = false }: { collapsed?: boolean }) {
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0];

  return (
    <div className={cn("rounded-card border border-primary/20 bg-primary/10 p-2.5", collapsed && "grid place-items-center p-2")}>
      {collapsed ? (
        <Tooltip label="Usage">
          <WalletCards className="h-4 w-4 text-primary-soft" />
        </Tooltip>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-soft">
            <WalletCards className="h-3.5 w-3.5" /> Usage
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted">Tokens</p>
              <p className="font-semibold text-white">{formatTokens(activeWorkspace?.stats.tokenUsage ?? 0)}</p>
            </div>
            <div>
              <p className="text-muted">Cost</p>
              <p className="font-semibold text-white">{formatCurrency(activeWorkspace?.stats.cost ?? 0)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
