"use client";

import { useCallback, useEffect, useState } from "react";
import { applyTheme, resolveInitialTheme, type Theme } from "./index";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    setThemeState(resolveInitialTheme());
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggle, isDark: theme === "dark", isLight: theme === "light" };
}
