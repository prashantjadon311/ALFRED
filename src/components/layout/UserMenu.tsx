"use client";

import dynamic from "next/dynamic";
import { PopoverMenu } from "@/components/shared/PopoverMenu";
import { Tooltip } from "@/components/shared/Tooltip";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

const UserMenuPanel = dynamic(() => import("./UserMenuPanel").then((mod) => mod.UserMenuPanel), {
  ssr: false,
  loading: () => <div className="h-48 rounded-card bg-white/5" />
});

export function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const userName = useAuthStore((state) => state.user?.name ?? "Prashant");

  const avatar = (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-success text-sm font-bold text-white">
      {userName.slice(0, 1)}
    </span>
  );

  return (
    <PopoverMenu
      ariaLabel="Open user menu"
      placement={collapsed ? "right" : "top"}
      align={collapsed ? "left" : "right"}
      className={collapsed ? "grid place-items-center" : "w-full"}
      triggerClassName={collapsed ? "grid place-items-center" : ""}
      panelClassName="w-[260px] sm:w-72"
      trigger={(open) => {
        const content = collapsed ? (
          <span className={cn("grid h-10 w-10 place-items-center rounded-button transition hover:bg-white/7", open && "bg-primary/12")}>{avatar}</span>
        ) : (
          <span className={cn("flex items-center gap-3 rounded-card border border-surface-darkBorder bg-surface-darkElevated/55 p-2.5 transition hover:border-primary/40 hover:bg-surface-darkElevated", open && "border-primary/40 bg-primary/10")}>
            {avatar}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{userName}</span>
              <span className="block truncate text-xs text-primary-soft">Pro Workspace</span>
            </span>
          </span>
        );
        return collapsed ? <Tooltip label={userName}>{content}</Tooltip> : content;
      }}
    >
      {(close) => <UserMenuPanel close={close} />}
    </PopoverMenu>
  );
}
