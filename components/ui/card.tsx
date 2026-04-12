import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardTone = "neutral" | "student" | "teacher";

const toneClassMap: Record<CardTone, string> = {
  neutral: "border-border bg-surface",
  student: "border-student/35 bg-surface",
  teacher: "border-teacher/35 bg-surface",
};

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: CardTone;
  interactive?: boolean;
};

export function Card({
  tone = "neutral",
  interactive = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border p-5 sm:p-6",
        toneClassMap[tone],
        interactive && "transition-transform duration-200 hover:-translate-y-0.5",
        className,
      )}
      {...props}
    />
  );
}
