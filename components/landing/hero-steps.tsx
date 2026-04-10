"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import type { FeatureType } from "@/components/landing/types";

const steps: Array<{ id: string; title: string; tab: FeatureType }> = [
  {
    id: "01",
    title: "Rozwiązuj pytania egzaminacyjne",
    tab: "sets",
  },
  {
    id: "02",
    title: "Zobacz krótkie wyjaśnienie",
    tab: "explaining",
  },
  {
    id: "03",
    title: "Sprawdź wynik",
    tab: "analysis",
  },
  {
    id: "04",
    title: "Rozwiązuj je dalej",
    tab: "account",
  },
];

const tabToIndex: Record<FeatureType, number> = {
  sets: 0,
  explaining: 1,
  analysis: 2,
  account: 3,
};

type HeroStepsVariant = "all" | "mobile" | "desktop";

type HeroStepsProps = {
  activeTab: FeatureType;
  visitedTabs?: FeatureType[];
  variant?: HeroStepsVariant;
};

type MobilePhase = "idle" | "exit" | "enterFrom";

const MOBILE_EXIT_MS = 170;
const MOBILE_ENTER_KICK_MS = 16;

function MobileHeroStepSwitcher({ activeTab, visitedTabs = [activeTab] }: { activeTab: FeatureType; visitedTabs?: FeatureType[] }) {
  const [mobileStepIndex, setMobileStepIndex] = useState(0);
  const [mobilePhase, setMobilePhase] = useState<MobilePhase>("idle");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const visitedSet = new Set(visitedTabs);

  const clearTimers = () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    const nextIndex = tabToIndex[activeTab];

    if (nextIndex === mobileStepIndex) {
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      clearTimers();

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setMobileStepIndex(nextIndex);
        setMobilePhase("idle");
        return;
      }

      setMobilePhase("exit");

      const exitTimer = setTimeout(() => {
        setMobileStepIndex(nextIndex);
        setMobilePhase("enterFrom");

        const enterKickTimer = setTimeout(() => {
          setMobilePhase("idle");
        }, MOBILE_ENTER_KICK_MS);

        timersRef.current.push(enterKickTimer);
      }, MOBILE_EXIT_MS);

      timersRef.current.push(exitTimer);
    });

    return () => window.cancelAnimationFrame(raf);
  }, [activeTab, mobileStepIndex]);

  const handleNextMobileStep = () => {
    if (mobilePhase !== "idle") {
      return;
    }

    clearTimers();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMobileStepIndex((prev) => (prev + 1) % steps.length);
      return;
    }

    setMobilePhase("exit");

    const exitTimer = setTimeout(() => {
      setMobileStepIndex((prev) => (prev + 1) % steps.length);
      setMobilePhase("enterFrom");

      const enterKickTimer = setTimeout(() => {
        setMobilePhase("idle");
      }, MOBILE_ENTER_KICK_MS);

      timersRef.current.push(enterKickTimer);
    }, MOBILE_EXIT_MS);

    timersRef.current.push(exitTimer);
  };

  const mobileMotionClass =
    mobilePhase === "idle"
      ? "translate-y-0 opacity-100 duration-[200ms]"
      : mobilePhase === "exit"
      ? "translate-y-1.5 opacity-0 duration-[170ms]"
      : "translate-y-1.5 opacity-0 duration-[0ms]";

  return (
    <button
      type="button"
      onClick={handleNextMobileStep}
      className="motion-fade-up mt-2 mx-auto block w-fit rounded-lg px-1.5 py-2 text-left transition-[background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:bg-indigo-500/[0.08] md:hidden"
      style={{ animationDelay: "280ms", animationDuration: "430ms" }}
      aria-label="Pokaż następny krok"
    >
        <span
        className={`inline-grid grid-cols-[auto_1fr] items-center gap-x-3 transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none ${mobileMotionClass}`}
      >
        <span
          className={`inline-flex h-6 min-w-[3.1rem] items-center justify-center gap-1 rounded-full border px-1.5 text-[10px] font-bold tracking-[0.12em] transition-[background-color,border-color,color] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            visitedSet.has(steps[mobileStepIndex].tab)
              ? "border-emerald-300/30 bg-emerald-500/[0.14] text-emerald-200"
              : "border-indigo-200/35 bg-indigo-500/[0.24] text-indigo-100"
          }`}
        >
          <span>{steps[mobileStepIndex].id}</span>
          <Check
            className={`h-3.5 w-3.5 ${visitedSet.has(steps[mobileStepIndex].tab) ? "opacity-100" : "opacity-0"}`}
            strokeWidth={2.4}
          />
        </span>

        <span className="w-fit rounded-md bg-indigo-500/[0.1] px-2 py-1 text-[0.82rem] leading-snug font-semibold text-white">
          {steps[mobileStepIndex].title}
        </span>
      </span>
    </button>
  );
}

function DesktopHeroStepsList({ activeTab, visitedTabs = [activeTab] }: { activeTab: FeatureType; visitedTabs?: FeatureType[] }) {
  const visitedSet = new Set(visitedTabs);

  return (
    <ol className="mt-3.5 hidden w-full max-w-[320px] text-left sm:max-w-[360px] md:mt-4 md:block md:max-w-[420px] lg:max-w-[30rem] min-[1440px]:mt-5 min-[1440px]:max-w-[34rem] min-[2200px]:max-w-[40rem]">
      {steps.map((step, index) => {
        const isActive = step.tab === activeTab;
        const isChecked = visitedSet.has(step.tab);

        return (
          <li
            key={step.id}
            className="group motion-fade-up grid grid-cols-[auto_1fr] items-center gap-x-3 py-2 min-[1440px]:gap-x-4 min-[1440px]:py-2.5 min-[2200px]:py-3"
            style={{ animationDelay: `${280 + index * 60}ms`, animationDuration: "430ms" }}
          >
            <span
              className={`inline-flex h-6 min-w-[3.1rem] items-center justify-center gap-1 rounded-full border px-1.5 text-[10px] font-bold tracking-[0.12em] transition-[background-color,border-color,color,transform] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none min-[1440px]:h-7 min-[1440px]:min-w-[3.5rem] min-[1440px]:text-[11px] min-[2200px]:h-8 min-[2200px]:min-w-[4rem] min-[2200px]:text-xs ${
                isChecked
                  ? "border-emerald-300/30 bg-emerald-500/[0.14] text-emerald-200"
                  : isActive
                  ? "border-transparent bg-indigo-500/[0.24] text-indigo-100"
                  : "border-indigo-300/16 bg-indigo-500/[0.08] text-indigo-100/78 lg:group-hover:border-indigo-200/30 lg:group-hover:bg-indigo-500/[0.16] lg:group-hover:text-indigo-100 lg:group-hover:scale-[1.03]"
              }`}
            >
              <span>{step.id}</span>
              <Check
                className={`h-3.5 w-3.5 min-[1440px]:h-4 min-[1440px]:w-4 ${isChecked ? "opacity-100" : "opacity-0"}`}
                strokeWidth={2.4}
              />
            </span>

            <p
              className={`w-fit text-[0.82rem] leading-snug font-semibold transition-[color,background-color,border-color] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)] md:text-[0.86rem] min-[1440px]:text-[0.95rem] min-[2200px]:text-[1.05rem] ${
                isActive ? "rounded-md bg-indigo-500/[0.1] px-2 py-1 text-white min-[1440px]:px-2.5 min-[1440px]:py-1.5" : "text-white/80 lg:group-hover:text-white/92"
              }`}
            >
              {step.title}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export default function HeroSteps({ activeTab, visitedTabs, variant = "all" }: HeroStepsProps) {
  const showMobile = variant !== "desktop";
  const showDesktop = variant !== "mobile";

  return (
    <>
      {showMobile ? <MobileHeroStepSwitcher activeTab={activeTab} visitedTabs={visitedTabs} /> : null}
      {showDesktop ? <DesktopHeroStepsList activeTab={activeTab} visitedTabs={visitedTabs} /> : null}
    </>
  );
}
