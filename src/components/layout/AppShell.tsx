"use client";

import { Menu } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AiPageLoader } from "@/components/shared/AiPageLoader";
import { useUiStore } from "@/store/ui-store";
import { AppSidebar } from "./AppSidebar";

const CommandPalette = dynamic(() => import("@/components/shared/CommandPalette").then((mod) => mod.CommandPalette), { ssr: false });

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const theme = useUiStore((state) => state.theme);
  const pageLoading = useUiStore((state) => state.pageLoading);
  const setPageLoading = useUiStore((state) => state.setPageLoading);
  const fullScreenPage = useUiStore((state) => state.fullScreenPage);
  const setFullScreenPage = useUiStore((state) => state.setFullScreenPage);
  const commandPaletteOpen = useUiStore((state) => state.commandPaletteOpen);
  const setCommandPaletteOpen = useUiStore((state) => state.setCommandPaletteOpen);
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen);
  const toggleMobileSidebar = useUiStore((state) => state.toggleMobileSidebar);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setInitialLoading(false), 520);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    setFullScreenPage(null);
    setPageLoading(true);
    const timeout = window.setTimeout(() => setPageLoading(false), 220);
    return () => window.clearTimeout(timeout);
  }, [pathname, setFullScreenPage, setPageLoading]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (meta && event.key.toLowerCase() === "n") {
        event.preventDefault();
        void import("@/store/chat-store").then(({ useChatStore }) => {
          useChatStore.getState().createChat("New agent session");
        });
      }
      if (event.key === "Escape") {
        setCommandPaletteOpen(false);
        setMobileSidebarOpen(false);
        setFullScreenPage(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setCommandPaletteOpen, setFullScreenPage, setMobileSidebarOpen]);

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isPlaygroundPage = pathname.startsWith("/playground");

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-slate-100">
      {fullScreenPage ? null : <AppSidebar />}
      {!fullScreenPage ? (
        <button
          type="button"
          aria-label="Open navigation"
          className="fixed left-3 top-3 z-40 inline-flex h-9 w-9 items-center justify-center gap-2 rounded-button border border-surface-darkBorder bg-surface-darkElevated/80 p-0 font-medium text-slate-100 transition duration-200 hover:-translate-y-px hover:border-primary/45 hover:bg-surface-darkElevated active:translate-y-0 md:hidden"
          onClick={toggleMobileSidebar}
        >
          <Menu className="h-4 w-4" />
        </button>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <main
          className={
            fullScreenPage
              ? "min-h-0 flex-1 overflow-hidden p-0"
              : isPlaygroundPage
                ? "min-h-0 flex-1 overflow-hidden pt-14 md:p-0"
                : "custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3 pt-16 md:p-4"
          }
        >
          {children}
        </main>
      </div>
      {commandPaletteOpen ? <CommandPalette /> : null}
      <AiPageLoader visible={initialLoading || pageLoading} />
    </div>
  );
}
