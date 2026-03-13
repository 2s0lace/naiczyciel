import { Zap, Brain, BarChart3, UserCircle2 } from "lucide-react";
import type { FeatureType } from "@/components/landing/types";

type TabBadge = {
  label: string;
  side: "left" | "right";
};

interface Props {
  activeTab: FeatureType;
  onChange: (tab: FeatureType) => void;
  badges?: Partial<Record<FeatureType, TabBadge>>;
}

const DEFAULT_BADGES: Partial<Record<FeatureType, TabBadge>> = {
  sets: {
    label: "JAK CKE",
    side: "left",
  },
  analysis: {
    label: "Z AI",
    side: "left",
  },
};

export default function FeatureTabs({ activeTab, onChange, badges }: Props) {
  const tabs = [
    { id: "sets", label: "Zestawy", icon: Zap, color: "text-yellow-400" },
    { id: "explaining", label: "Wyjaśnienia", icon: Brain, color: "text-pink-400" },
    { id: "analysis", label: "Analiza", icon: BarChart3, color: "text-blue-400" },
    { id: "account", label: "KONTO", icon: UserCircle2, color: "text-indigo-300" },
  ] as const;

  const resolvedBadges = {
    ...DEFAULT_BADGES,
    ...(badges ?? {}),
  } satisfies Partial<Record<FeatureType, TabBadge>>;

  return (
    <div className="grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 md:gap-2.5 md:rounded-3xl md:p-2 lg:gap-2 lg:p-1.5">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const badge = resolvedBadges[tab.id];
        const badgePositionClass =
          badge?.side === "right"
            ? "-top-2 -right-2 md:-top-2.5 md:-right-1.5 lg:-top-2 lg:-right-1"
            : "-top-2 -left-2 md:-top-2.5 md:-left-1.5 lg:-top-2 lg:-left-1";

        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`group relative flex flex-col items-center gap-1.5 rounded-xl py-3.5 transition-[background-color,opacity,transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none md:gap-2 md:py-4 lg:gap-1.5 lg:py-3.5 ${
              isActive
                ? "bg-white/12 ring-1 ring-white/15"
                : "bg-transparent opacity-88 hover:bg-white/7 hover:opacity-100"
            }`}
          >
            {badge ? (
              <span
                className={`absolute ${badgePositionClass} rounded-full border border-emerald-200/85 bg-emerald-950 px-1.5 py-[2px] text-[9px] font-bold tracking-wide text-emerald-100 ring-1 ring-emerald-200/30 shadow-[0_0_0_1px_rgba(16,185,129,0.2),0_0_12px_rgba(16,185,129,0.35)]`}
              >
                {badge.label}
              </span>
            ) : null}

            <tab.icon
              size={20}
              className={`${tab.color} transition-[transform,filter,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none ${
                isActive ? "scale-[1.04] opacity-100" : "opacity-92 group-hover:scale-[1.05] group-hover:brightness-110"
              }`}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span
              className={`text-[11px] font-bold tracking-tight uppercase transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] md:text-[11.5px] ${
                isActive ? "text-white" : "text-gray-300 group-hover:text-gray-100"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
