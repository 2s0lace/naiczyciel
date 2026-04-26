"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme/use-theme";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { toggle, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Włącz tryb jasny" : "Włącz tryb ciemny"}
      className={[
        "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        "text-[--color-app-muted] hover:text-[--color-app] hover:bg-[--color-surface]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
