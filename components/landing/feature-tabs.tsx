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
    <div className="relative grid grid-cols-4 gap-2 overflow-visible rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(255,255,255,0.04),0_22px_40px_-30px_rgba(0,0,0,0.9)] backdrop-blur-[18px] md:gap-2.5 md:rounded-3xl md:p-2 lg:gap-2 lg:p-1.5">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-[12%] w-28 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_72%)] blur-2xl"
      />
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const badge = resolvedBadges[tab.id];
        const badgePositionClass =
          badge?.side === "right"
            ? "-top-2 right-2 md:-top-2.5 md:right-2.5 lg:-top-2 lg:right-2"
            : "-top-2 left-2 md:-top-2.5 md:left-2.5 lg:-top-2 lg:left-2";

        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`group relative flex flex-col items-center gap-1.5 rounded-xl border py-3.5 transition-[background-color,opacity,transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none md:gap-2 md:py-4 lg:gap-1.5 lg:py-3.5 ${
              isActive
                ? "border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.09))] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_12px_24px_-18px_rgba(255,255,255,0.18)] backdrop-blur-[22px]"
                : "border-transparent bg-transparent opacity-88 hover:border-white/10 hover:bg-white/[0.06] hover:opacity-100"
            }`}
          >
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-x-5 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-opacity duration-200 ${
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-70"
              }`}
            />
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-200 ${
                isActive
                  ? "bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_58%)] opacity-100"
                  : "bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_58%)] opacity-0 group-hover:opacity-80"
              }`}
            />
            {badge ? (
              <span
                className={`absolute z-20 ${badgePositionClass} rounded-full border border-emerald-200/70 bg-[linear-gradient(180deg,rgba(8,58,50,0.95),rgba(5,35,31,0.88))] px-1.5 py-[2px] text-[9px] font-bold tracking-wide text-emerald-100 ring-1 ring-emerald-200/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_0_1px_rgba(16,185,129,0.16),0_0_12px_rgba(16,185,129,0.24)] backdrop-blur-sm`}
              >
                {badge.label}
              </span>
            ) : null}

            <tab.icon
              size={20}
              className={`${tab.color} relative z-10 transition-[transform,filter,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none ${
                isActive ? "scale-[1.04] opacity-100 drop-shadow-[0_0_12px_rgba(255,255,255,0.16)]" : "opacity-92 group-hover:scale-[1.05] group-hover:brightness-110"
              }`}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span
              className={`relative z-10 text-[11px] font-bold tracking-tight uppercase transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] md:text-[11.5px] ${
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
