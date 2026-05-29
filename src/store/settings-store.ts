import { create } from "zustand";
import { budgetRules as mockBudgetRules } from "@/lib/mock-data";
import type { BudgetRule } from "@/lib/types";

const STORAGE_KEY = "alfred_settings";

interface SettingsStore {
  globalTemperature: number;
  topP: number;
  maxTokens: number;
  maxIterations: number;
  budgetRules: BudgetRule[];
  setGlobalTemperature: (value: number) => void;
  setTopP: (value: number) => void;
  setMaxTokens: (value: number) => void;
  setMaxIterations: (value: number) => void;
}

function readSettings() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<SettingsStore>;
  } catch {
    return {};
  }
}

function writeSettings(patch: Partial<SettingsStore>) {
  if (typeof window === "undefined") return;
  const current = readSettings();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
}

const stored = readSettings();

export const useSettingsStore = create<SettingsStore>((set) => ({
  globalTemperature: typeof stored.globalTemperature === "number" ? stored.globalTemperature : 0.4,
  topP: typeof stored.topP === "number" ? stored.topP : 0.9,
  maxTokens: typeof stored.maxTokens === "number" ? stored.maxTokens : 12000,
  maxIterations: typeof stored.maxIterations === "number" ? stored.maxIterations : 6,
  budgetRules: Array.isArray(stored.budgetRules) ? stored.budgetRules : mockBudgetRules,
  setGlobalTemperature: (value) => {
    writeSettings({ globalTemperature: value });
    set({ globalTemperature: value });
  },
  setTopP: (value) => {
    writeSettings({ topP: value });
    set({ topP: value });
  },
  setMaxTokens: (value) => {
    writeSettings({ maxTokens: value });
    set({ maxTokens: value });
  },
  setMaxIterations: (value) => {
    writeSettings({ maxIterations: value });
    set({ maxIterations: value });
  }
}));
