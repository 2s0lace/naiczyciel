"use client";

import { useEffect, useState } from "react";

type OnboardingTarget = "question-area" | "hint-action" | "fifty-action";

export type QuizOnboardingStep = {
  target: OnboardingTarget;
  title: string;
  body: string;
};

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
};

type QuizOnboardingOverlayProps = {
  visible: boolean;
  stepIndex: number;
  steps: QuizOnboardingStep[];
  onNext: () => void;
  onSkip: () => void;
};

function getTargetPadding(target: OnboardingTarget) {
  if (target === "question-area") {
    return 10;
  }

  return 7;
}

function getTargetRadius(target: OnboardingTarget) {
  if (target === "question-area") {
    return 18;
  }

  return 999;
}

function resolveHighlightRect(target: OnboardingTarget): HighlightRect | null {
  const element = document.querySelector(`[data-onboarding-target="${target}"]`) as HTMLElement | null;

  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  const padding = getTargetPadding(target);

  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  const top = Math.max(8, rect.top - padding);
  const left = Math.max(8, rect.left - padding);
  const width = Math.min(window.innerWidth - left - 8, rect.width + padding * 2);
  const height = rect.height + padding * 2;

  return {
    top,
    left,
    width,
    height,
    radius: getTargetRadius(target),
  };
}

export function QuizOnboardingOverlay({ visible, stepIndex, steps, onNext, onSkip }: QuizOnboardingOverlayProps) {
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);

  const safeIndex = Math.max(0, Math.min(stepIndex, steps.length - 1));
  const currentStep = steps[safeIndex];

  useEffect(() => {
    if (!visible || !currentStep) {
      return;
    }

    let frameId = 0;
    let observer: ResizeObserver | null = null;

    const updateRect = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        setHighlightRect(resolveHighlightRect(currentStep.target));
      });
    };

    updateRect();

    const element = document.querySelector(`[data-onboarding-target="${currentStep.target}"]`) as HTMLElement | null;

    if (element && "ResizeObserver" in window) {
      observer = new ResizeObserver(updateRect);
      observer.observe(element);
    }

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [currentStep, visible]);

  if (!visible || !currentStep) {
    return null;
  }

  const isLastStep = safeIndex === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[95]">
      {highlightRect ? (
        <>
          <div className="absolute inset-x-0 top-0 z-[5] bg-[#02030b]/74" style={{ height: highlightRect.top }} />
          <div
            className="absolute left-0 z-[5] bg-[#02030b]/74"
            style={{ top: highlightRect.top, width: highlightRect.left, height: highlightRect.height }}
          />
          <div
            className="absolute right-0 z-[5] bg-[#02030b]/74"
            style={{
              top: highlightRect.top,
              width: `calc(100vw - ${highlightRect.left + highlightRect.width}px)`,
              height: highlightRect.height,
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 z-[5] bg-[#02030b]/74"
            style={{ top: highlightRect.top + highlightRect.height }}
          />

          <div className="absolute inset-0 z-[6]" />

          <div
            className="pointer-events-none absolute z-10 transition-all duration-300 ease-out"
            style={{
              top: `${highlightRect.top}px`,
              left: `${highlightRect.left}px`,
              width: `${highlightRect.width}px`,
              height: `${highlightRect.height}px`,
              borderRadius: `${highlightRect.radius}px`,
              border: "1px solid rgba(129,140,248,0.88)",
              boxShadow: "0 0 24px rgba(99,102,241,0.35)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 z-[5] bg-[#02030b]/74" />
      )}

      <div className="absolute inset-x-0 bottom-0 z-[15] bg-gradient-to-t from-[#02030b]/96 via-[#02030b]/88 to-[#02030b]/30 [height:calc(env(safe-area-inset-bottom)+7.5rem)]" />

      <div className="absolute inset-x-0 z-20 bg-gradient-to-t from-[#02030b] via-[#02030b]/94 to-transparent px-4 pt-20 pb-4 [bottom:calc(env(safe-area-inset-bottom)+8rem)]">
        <div className="mx-auto w-full max-w-md">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-indigo-100/70 uppercase">
            Krok {safeIndex + 1}/{steps.length}
          </p>

          <div key={`${currentStep.target}-${safeIndex}`} className="mt-2 transition-all duration-200">
            <h3 className="text-[1.02rem] leading-6 font-semibold text-white">{currentStep.title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-indigo-100/85">{currentStep.body}</p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onSkip}
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-indigo-100/80 transition-colors hover:text-white"
            >
              Pomiń
            </button>

            <button
              type="button"
              onClick={onNext}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_-18px_rgba(59,130,246,0.75)]"
            >
              {isLastStep ? "Zaczynamy" : "Dalej"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




