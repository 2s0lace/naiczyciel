import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "student"
  | "teacher";

export type ButtonSize = "sm" | "md" | "lg";

const baseClass =
  "inline-flex items-center justify-center rounded-xl border text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:ring-[var(--color-focus)] disabled:pointer-events-none disabled:opacity-50";

const variantClassMap: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-app text-bg hover:bg-white/90",
  secondary: "border-border bg-surface text-app hover:bg-surface-muted",
  ghost:
    "border-transparent bg-transparent text-app-muted hover:bg-white/5 hover:text-app",
  student: "border-transparent bg-student text-white hover:brightness-110",
  teacher: "border-transparent bg-teacher text-bg hover:brightness-110",
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5",
  md: "h-11 px-5",
  lg: "h-12 px-6 text-base",
};

type ButtonVariantOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: ButtonVariantOptions = {}) {
  return cn(
    baseClass,
    variantClassMap[variant],
    sizeClassMap[size],
    fullWidth && "w-full",
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
