"use client";

import { CreditCard, Keyboard, LogOut, Moon, Settings, SlidersHorizontal, Sun, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import { useWorkspaceStore } from "@/store/workspace-store";

export function UserMenuPanel({ close }: { close: () => void }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const setPageLoading = useUiStore((state) => state.setPageLoading);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  const signOut = async () => {
    await logout();
    setPageLoading(true);
    router.replace("/login");
  };

  const navigate = (path: string) => {
    setPageLoading(true);
    router.push(path);
    close();
  };

  const avatar = (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-success text-sm font-bold text-white">
      {(user?.name ?? "P").slice(0, 1)}
    </span>
  );

  return (
    <div>
      <div className="flex items-center gap-3 rounded-card bg-white/5 p-3">
        {avatar}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{user?.name ?? "Prashant"}</p>
          <p className="truncate text-xs text-muted">{user?.email ?? "prashant@alfred.local"}</p>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {[
          { label: "Profile", icon: UserRound, href: "/profile" },
          { label: "Account settings", icon: Settings, href: "/account" },
          { label: "Workspace settings", icon: SlidersHorizontal, href: `/workspaces/${activeWorkspaceId}/settings` },
          { label: "Usage & billing", icon: CreditCard, href: "/billing" },
          { label: "Keyboard shortcuts", icon: Keyboard, href: "/keyboard-shortcuts" }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              className="flex w-full items-center gap-2 rounded-button px-2.5 py-2 text-left text-sm text-slate-300 transition hover:bg-white/7 hover:text-white"
              onClick={() => navigate(item.href)}
            >
              <Icon className="h-4 w-4 text-muted" />
              {item.label}
            </button>
          );
        })}
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-button px-2.5 py-2 text-left text-sm text-slate-300 transition hover:bg-white/7 hover:text-white"
          onClick={() => {
            toggleTheme();
            close();
          }}
        >
          {theme === "dark" ? <Moon className="h-4 w-4 text-muted" /> : <Sun className="h-4 w-4 text-muted" />}
          Theme
          <span className="ml-auto rounded-full border border-surface-darkBorder px-2 py-0.5 text-[11px] text-muted">{theme === "dark" ? "Dark" : "Light"}</span>
        </button>
      </div>

      <div className="mt-2 border-t border-surface-darkBorder pt-2">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-button px-2.5 py-2 text-left text-sm text-danger transition hover:bg-danger/10"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
