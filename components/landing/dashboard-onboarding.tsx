"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type DashboardOnboardingStep = {
  id: string;
  target: string;
  title: string;
  text: string;
};

type RectState = {
  top: number;
  left: number;
  width: number;
  height: number;
} | null;

type DashboardOnboardingProps = {
  steps: DashboardOnboardingStep[];
  onComplete: () => void;
  onSkip: () => void;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function DashboardOnboarding({ steps, onComplete, onSkip }: DashboardOnboardingProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<RectState>(null);

  const step = steps[stepIndex] ?? null;
  const isLastStep = stepIndex >= steps.length - 1;

  useEffect(() => {
    if (!step || typeof window === "undefined") {
      return;
    }

    const updateTargetRect = () => {
      const element = document.querySelector(step.target) as HTMLElement | null;

      if (!element) {
        setTargetRect(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    const element = document.querySelector(step.target) as HTMLElement | null;
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }

    updateTargetRect();

    const rafUpdate = () => {
      window.requestAnimationFrame(updateTargetRect);
    };

    window.addEventListener("resize", rafUpdate);
    window.addEventListener("scroll", rafUpdate, { passive: true });

    return () => {
      window.removeEventListener("resize", rafUpdate);
      window.removeEventListener("scroll", rafUpdate);
    };
  }, [step]);

  const tooltipStyle = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      } as const;
    }

    const tooltipWidth = Math.min(320, Math.max(260, window.innerWidth - 24));

    if (!targetRect) {
      return {
        top: "50%",
        left: "50%",
        width: `${tooltipWidth}px`,
        transform: "translate(-50%, -50%)",
      } as const;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const preferredTop = targetRect.top + targetRect.height + 14;
    const maxTop = viewportHeight - 190;
    const top = clamp(preferredTop, 16, Math.max(16, maxTop));

    const preferredLeft = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    const left = clamp(preferredLeft, 12, Math.max(12, viewportWidth - tooltipWidth - 12));

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      transform: "none",
    } as const;
  }, [targetRect]);

  const highlightStyle = useMemo(() => {
    if (!targetRect) {
      return null;
    }

    return {
      top: `${targetRect.top - 6}px`,
      left: `${targetRect.left - 6}px`,
      width: `${targetRect.width + 12}px`,
      height: `${targetRect.height + 12}px`,
    } as const;
  }, [targetRect]);

  const handleNext = () => {    if (isLastStep) {
      onComplete();
      return;
    }

    setStepIndex((prev) => prev + 1);
  };

  if (!step) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120]">
      {!highlightStyle ? <div className="absolute inset-0 bg-[#040815]/72" /> : null}

      {highlightStyle ? (
        <div
          className="pointer-events-none absolute rounded-2xl border border-indigo-200/55 shadow-[0_0_0_1px_rgba(165,180,252,0.7),0_0_0_9999px_rgba(4,8,21,0.52),0_22px_42px_-26px_rgba(99,102,241,0.9)] transition-all duration-200"
          style={highlightStyle}
        />
      ) : null}

      <div
        className={cn(
          "absolute rounded-2xl border border-white/14 bg-[#0b1226]/95 p-4 text-white shadow-[0_22px_44px_-28px_rgba(0,0,0,0.95)]",
          "transition-[top,left] duration-200",
        )}
        style={tooltipStyle}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-[0.09em] text-indigo-100/78 uppercase">Krok {stepIndex + 1}/{steps.length}</p>
        </div>

        <h3 className="text-sm font-semibold text-white">{step.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-indigo-100/82">{step.text}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-lg border border-white/14 px-3 py-1.5 text-xs font-semibold text-gray-200 transition-[border-color,background-color] duration-150 hover:border-white/26 hover:bg-white/6"
          >
            Pomiń
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg bg-indigo-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-indigo-400 active:scale-[0.985]"
          >
            {isLastStep ? "Zaczynam" : "Dalej"}
          </button>
        </div>
      </div>
    </div>
  );
}






