"use client";

import {
  Bot,
  Boxes,
  BrainCircuit,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Coins,
  Command,
  FolderKanban,
  Library,
  Search,
  Settings,
  Workflow,
  X
} from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { AppLink } from "@/components/shared/AppLink";
import { Tooltip } from "@/components/shared/Tooltip";
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";
import { UserMenu } from "@/components/layout/UserMenu";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

const SidebarUsageCard = dynamic(() => import("./SidebarUsageCard").then((mod) => mod.SidebarUsageCard), {
  ssr: false,
  loading: () => <div className="h-[82px] rounded-card border border-primary/20 bg-primary/10" />
});

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-button font-medium transition duration-200 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50";
const iconButton = "h-9 w-9 p-0";
const primaryButton = "bg-primary text-white shadow-glow hover:bg-primary/90";
const ghostButton = "text-slate-300 hover:bg-white/7 hover:text-white";

const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: ChartNoAxesCombined },
  { label: "Playground", href: "/playground", icon: Bot },
  { label: "Compare Mode", href: "/compare", icon: BrainCircuit },
  { label: "Agent Studio", href: "/agent-studio", icon: Workflow },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Workflow Runs", href: "/workflows", icon: Boxes },
  { label: "Models", href: "/models", icon: BrainCircuit },
  { label: "Usage & Cost", href: "/usage", icon: Coins },
  { label: "Prompt Library", href: "/library", icon: Library },
  { label: "Settings", href: "/settings", icon: Settings }
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const mobileOpen = useUiStore((state) => state.mobileSidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen);
  const setCommandPaletteOpen = useUiStore((state) => state.setCommandPaletteOpen);

  const closeMobile = () => setMobileSidebarOpen(false);
  const handleNewChat = () => {
    void import("@/store/chat-store").then(({ useChatStore }) => {
      useChatStore.getState().createChat("New agent session");
      router.push("/playground");
      closeMobile();
    });
  };

  const content = (isCollapsed: boolean, isMobile = false) => (
    <>
      <div className={cn("flex min-h-16 items-center gap-2 border-b border-surface-darkBorder px-3", isCollapsed && "justify-center px-2")}>
        <div className={cn("min-w-0 flex-1", isCollapsed && "flex-none")}>
          <WorkspaceSwitcher collapsed={isCollapsed} onNavigate={closeMobile} />
        </div>
        {isMobile ? (
          <button type="button" className={cn(buttonBase, iconButton, ghostButton, "ml-auto")} aria-label="Close navigation" onClick={closeMobile}>
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            className={cn(buttonBase, iconButton, ghostButton, "ml-auto h-8 w-8", isCollapsed && "absolute left-12 top-4 z-10 bg-surface-darkElevated/90")}
            aria-label="Toggle sidebar"
            onClick={toggleSidebar}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
        <button
          className={cn(
            "mb-3 flex h-10 w-full items-center gap-3 rounded-button border border-surface-darkBorder bg-surface-darkElevated/70 px-3 text-left text-sm text-muted transition hover:-translate-y-px hover:border-primary/40 hover:bg-surface-darkElevated hover:text-white",
            isCollapsed && "justify-center px-0"
          )}
          onClick={() => {
            setCommandPaletteOpen(true);
            if (isMobile) closeMobile();
          }}
          aria-label="Open command palette"
          title="Search"
        >
          <Search className="h-4 w-4 shrink-0" />
          {!isCollapsed ? (
            <>
              <span className="truncate">Search</span>
              <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-surface-darkBorder px-2 py-1 text-[11px] text-slate-400">
                <Command className="h-3 w-3" /> K
              </span>
            </>
          ) : null}
        </button>

        <button
          type="button"
          className={cn(buttonBase, primaryButton, "mb-4 h-10 w-full px-4 text-sm", isCollapsed ? "px-0" : "")}
          aria-label="New chat"
          title="New Chat"
          onClick={handleNewChat}
        >
          <CirclePlus className="h-4 w-4" />
          {!isCollapsed ? "New Chat" : null}
        </button>

        <nav className="space-y-1" aria-label="Main navigation">
          {mainNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const navItem = (
              <AppLink
                key={item.href}
                href={item.href}
                title={item.label}
                onClick={() => isMobile && closeMobile()}
                className={cn(
                  "group relative flex h-10 items-center gap-3 rounded-button px-3 text-sm font-medium text-slate-300 transition hover:-translate-y-px hover:bg-white/7 hover:text-white",
                  isCollapsed && "justify-center px-0",
                  active && "bg-primary/12 text-white shadow-[inset_0_0_0_1px_rgba(89,85,209,.18)]"
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 h-0 w-1 rounded-r-full bg-primary transition-all duration-200 group-hover:h-5",
                    active && "h-7"
                  )}
                />
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
              </AppLink>
            );
            return isCollapsed ? <Tooltip key={item.href} label={item.label}>{navItem}</Tooltip> : navItem;
          })}
        </nav>
      </div>

      <div className="space-y-3 border-t border-surface-darkBorder p-3">
        <SidebarUsageCard collapsed={isCollapsed} />

        <UserMenu collapsed={isCollapsed} />
      </div>
    </>
  );

  return (
    <>
      <aside
        className={cn(
          "relative z-30 hidden h-screen shrink-0 border-r border-surface-darkBorder/80 bg-surface-dark/75 backdrop-blur-xl transition-[width] duration-250 md:flex md:flex-col",
          collapsed ? "w-16" : "w-[248px]"
        )}
      >
        {content(collapsed)}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[90] md:hidden">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Close navigation overlay" onClick={closeMobile} />
          <aside className="relative z-[100] flex h-full w-[min(88vw,330px)] flex-col border-r border-surface-darkBorder bg-surface-dark/95 shadow-glow backdrop-blur-xl transition-transform duration-200">
            {content(false, true)}
          </aside>
        </div>
      ) : null}
    </>
  );
}
