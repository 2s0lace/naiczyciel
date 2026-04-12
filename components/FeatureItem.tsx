import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColorClass?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const FeatureItem = ({
  icon: Icon,
  title,
  description,
  iconColorClass = "text-indigo-300 bg-indigo-400/10",
  isActive = false,
  onClick,
}: FeatureItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors",
        "hover:border-indigo-300/30 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60",
        isActive && "border-indigo-300/45 bg-indigo-400/10",
      )}
      aria-pressed={isActive}
    >
      <div className={cn("mt-0.5 rounded-xl border border-white/10 p-2.5", iconColorClass)}>
        <Icon size={18} strokeWidth={2.3} />
      </div>

      <div className="min-w-0">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{description}</p>
      </div>
    </button>
  );
};
