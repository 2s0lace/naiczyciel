import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
};

export function PageShell({ children, className, maxWidth }: PageShellProps) {
  return (
    <div
      className={cn("page-shell", className)}
      style={maxWidth ? ({ "--page-shell-max": maxWidth } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
