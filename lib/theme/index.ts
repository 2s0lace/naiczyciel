export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "naiczyciel-theme";
export const THEME_ATTR = "data-theme";
export const THEMES: Theme[] = ["dark", "light"];

export function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  return "dark";
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute(THEME_ATTR, theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}
