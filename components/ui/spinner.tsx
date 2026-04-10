type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4 border-[1.5px]",
  md: "h-5 w-5 border-2",
  lg: "h-8 w-8 border-2",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      aria-hidden
      className={[
        "inline-flex shrink-0 animate-spin rounded-full border-white/14 border-t-[#8F88FF] border-r-[#6C63FF]",
        sizeClasses[size],
        className ?? "",
      ].join(" ")}
    />
  );
}
