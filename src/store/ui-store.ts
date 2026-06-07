import { create } from "zustand";
import { nextTheme, readStoredTheme, writeStoredTheme, type AppTheme } from "@/lib/theme-utils";

type Theme = AppTheme;
type FullScreenPage = "playground" | "agent-studio" | null;

function getBrowserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

interface UiStore {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  theme: Theme;
  activeRightPanel: string | null;
  commandPaletteOpen: boolean;
  fullScreenPage: FullScreenPage;
  pageLoading: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setActiveRightPanel: (panel: string | null) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setFullScreenPage: (page: FullScreenPage) => void;
  setPageLoading: (loading: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  theme: readStoredTheme(getBrowserStorage(), "dark"),
  activeRightPanel: null,
  commandPaletteOpen: false,
  fullScreenPage: null,
  pageLoading: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
  setTheme: (theme) => {
    writeStoredTheme(getBrowserStorage(), theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const theme = nextTheme(state.theme);
      writeStoredTheme(getBrowserStorage(), theme);
      return { theme };
    }),
  setActiveRightPanel: (panel) => set({ activeRightPanel: panel }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setFullScreenPage: (page) => set({ fullScreenPage: page, mobileSidebarOpen: false }),
  setPageLoading: (loading) => set({ pageLoading: loading })
}));
