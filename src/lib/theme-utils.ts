export type AppTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "alfred_theme";

export interface ThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function isAppTheme(value: unknown): value is AppTheme {
  return value === "dark" || value === "light";
}

export function nextTheme(theme: AppTheme): AppTheme {
  return theme === "dark" ? "light" : "dark";
}

export function readStoredTheme(storage?: ThemeStorage | null, fallback: AppTheme = "dark"): AppTheme {
  if (!storage) return fallback;
  const stored = storage.getItem(THEME_STORAGE_KEY);
  return isAppTheme(stored) ? stored : fallback;
}

export function writeStoredTheme(storage: ThemeStorage | undefined | null, theme: AppTheme) {
  if (!storage) return;
  storage.setItem(THEME_STORAGE_KEY, theme);
}
