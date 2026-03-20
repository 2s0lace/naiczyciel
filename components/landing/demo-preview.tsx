"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Sparkles, Target, TriangleAlert, X } from "lucide-react";
import type { FeatureType } from "@/components/landing/types";

interface DemoPreviewProps {
  activeTab: FeatureType;
}

type TransitionPhase = "idle" | "exit" | "enterFrom";
type DisplayedView = "quiz" | "analysis" | "account";

const EXIT_MS = 200;
const ENTER_KICK_MS = 24;
const COLLAPSE_MS = 180;
const EXPLANATION_REVEAL_MS = 130;

export default function DemoPreview({ activeTab }: DemoPreviewProps) {
  const [displayedView, setDisplayedView] = useState<DisplayedView>(
    activeTab === "analysis" ? "analysis" : activeTab === "account" ? "account" : "quiz"
  );
  const [showExplanation, setShowExplanation] = useState(activeTab === "explaining");
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current = [];
    };

    const runExitEnter = (nextView: DisplayedView, nextShowExplanation: boolean) => {
      setPhase("exit");
      const exitTimer = setTimeout(() => {
        setDisplayedView(nextView);

        if (nextView === "quiz") {
          setShowExplanation(false);
        } else {
          setShowExplanation(nextShowExplanation);
        }

        setPhase("enterFrom");

        const enterKickTimer = setTimeout(() => {
          setPhase("idle");

          if (nextView === "quiz" && nextShowExplanation) {
            const explanationTimer = setTimeout(() => {
              setShowExplanation(true);
            }, EXPLANATION_REVEAL_MS);
            timersRef.current.push(explanationTimer);
          }
        }, ENTER_KICK_MS);

        timersRef.current.push(enterKickTimer);
      }, EXIT_MS);

      timersRef.current.push(exitTimer);
    };

    clearTimers();

    if (activeTab === "account") {
      if (displayedView === "account") {
        const settleTimer = setTimeout(() => {
          setPhase("idle");
          if (showExplanation) {
            setShowExplanation(false);
          }
        }, 0);
        timersRef.current.push(settleTimer);

        return () => clearTimers();
      }

      if (showExplanation) {
        const hideExplanationTimer = setTimeout(() => {
          setShowExplanation(false);
        }, 0);
        timersRef.current.push(hideExplanationTimer);

        const collapseTimer = setTimeout(() => {
          runExitEnter("account", false);
        }, COLLAPSE_MS);
        timersRef.current.push(collapseTimer);
      } else {
        runExitEnter("account", false);
      }

      return () => clearTimers();
    }

    if (activeTab === "analysis") {
      if (displayedView === "analysis") {
        const settleTimer = setTimeout(() => {
          setPhase("idle");

          if (showExplanation) {
            setShowExplanation(false);
          }
        }, 0);
        timersRef.current.push(settleTimer);

        return () => clearTimers();
      }

      if (showExplanation) {
        const hideExplanationTimer = setTimeout(() => {
          setShowExplanation(false);
        }, 0);
        timersRef.current.push(hideExplanationTimer);

        const collapseTimer = setTimeout(() => {
          runExitEnter("analysis", false);
        }, COLLAPSE_MS);
        timersRef.current.push(collapseTimer);
      } else {
        runExitEnter("analysis", false);
      }

      return () => clearTimers();
    }

    if (displayedView !== "quiz") {
      runExitEnter("quiz", activeTab === "explaining");
      return () => clearTimers();
    }

    const idlePhaseTimer = setTimeout(() => {
      setPhase("idle");
      setShowExplanation(activeTab === "explaining");
    }, 0);
    timersRef.current.push(idlePhaseTimer);

    return () => clearTimers();
  }, [activeTab, displayedView, showExplanation]);

  const isAnalysis = displayedView === "analysis";
  const isAccount = displayedView === "account";
  const isExplaining = showExplanation;
  const quizProgressValue = 7;
  const quizProgressWidth = `${(quizProgressValue / 10) * 100}%`;
  const analysisProgressValue = 80;
  const analysisProgressWidth = `${analysisProgressValue}%`;
  const sectionClass = isAnalysis || isAccount
    ? "overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A15] shadow-2xl md:min-h-[21rem] lg:min-h-[21.5rem] md:rounded-[2rem] md:shadow-[0_28px_70px_-48px_rgba(0,0,0,0.95)]"
    : "overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A15] shadow-2xl md:rounded-[2rem] md:shadow-[0_28px_70px_-48px_rgba(0,0,0,0.95)]";

  const motionClass =
    phase === "idle"
      ? "translate-y-0 scale-100 opacity-100 blur-0 duration-[240ms]"
      : phase === "exit"
      ? "translate-y-2 scale-[0.99] opacity-0 blur-[1.2px] duration-[200ms]"
      : "translate-y-3 scale-[0.995] opacity-0 blur-[1px] duration-[0ms]";

  return (
    <section
      className={`${sectionClass} -mx-2 w-[calc(100%+1rem)] sm:mx-0 sm:w-full lg:[transform-origin:center_center] lg:[transform:perspective(1200px)_translateX(-10px)_rotateY(-5deg)_rotateX(1deg)] lg:shadow-[20px_20px_60px_rgba(0,0,0,0.5)] lg:[transition:transform_0.4s_ease,box-shadow_0.4s_ease] lg:hover:[transform:perspective(1200px)_translateX(-10px)_rotateY(0deg)_rotateX(0deg)]`}
    >
      <div className={`transition-[opacity,transform,filter] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none motion-reduce:transform-none ${motionClass}`}>
        {isAccount ? (
          <>
            <header className="border-b border-white/5 px-4 py-3 md:px-5 md:py-4">
              <span className="inline-flex items-center rounded-md border border-indigo-500/25 bg-indigo-500/10 px-2 py-1 text-[9px] font-bold tracking-wider text-indigo-200 uppercase">
                Panel ucznia E8
              </span>
            </header>

            <div className="space-y-2.5 p-3 md:space-y-3 md:p-4">
              <div className="relative overflow-hidden rounded-2xl border border-indigo-300/25 bg-gradient-to-br from-indigo-400/20 via-indigo-500/8 to-slate-900/55 p-4 shadow-[0_14px_30px_-20px_rgba(99,102,241,0.85)] md:p-4">
                <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
                <div className="pointer-events-none absolute -right-8 -bottom-10 h-24 w-24 rounded-full bg-indigo-400/20 blur-2xl" />
                <p className="text-[10px] font-bold tracking-widest text-indigo-100 uppercase">Ostatni wynik</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="bg-gradient-to-b from-white via-indigo-100 to-indigo-200 bg-clip-text text-[2.3rem] leading-none font-black tracking-tight text-transparent md:text-[2.45rem]">
                    8/10
                  </p>
                  <div className="mb-1 flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/14">
                      <div className="h-full w-[80%] rounded-full bg-gradient-to-r from-indigo-300 to-violet-200" />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-100/85">80%</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/12 bg-white/[0.03] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="text-[10px] font-bold tracking-wide text-white/65 uppercase">Do poprawy</p>
                <p className="mt-1.5 text-base leading-none font-extrabold tracking-tight text-white">Prośby</p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-indigo-200/28 bg-gradient-to-r from-indigo-500/82 via-indigo-500/76 to-blue-500/80 px-3.5 py-3 shadow-[0_14px_24px_-20px_rgba(59,130,246,0.9)]">
                <p className="text-sm font-bold text-white">Nowa sesja →</p>
                <p className="rounded-md border border-white/22 bg-white/12 px-2 py-1 text-[10.5px] font-semibold text-indigo-50/95">10 pytań • 6–9 min</p>
              </div>
            </div>
          </>
        ) : isAnalysis ? (
          <>
            <header className="border-b border-white/5 px-4 py-3 md:px-5 md:py-4">
              <div className="inline-flex items-center gap-1.5 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-1">
                <Sparkles size={11} className="text-indigo-300" />
                <span className="text-[9px] font-bold tracking-wider text-indigo-200 uppercase">Podsumowanie</span>
              </div>
            </header>

            <div className="space-y-2 p-3 md:space-y-3 md:p-4 lg:space-y-2.5 lg:p-4">
              <div className="relative w-full overflow-hidden rounded-[1.3rem] border border-indigo-300/25 bg-gradient-to-br from-indigo-400/16 via-indigo-500/8 to-slate-900/55 p-3.5 shadow-[0_10px_24px_-18px_rgba(99,102,241,0.65)] md:p-4">
                <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
                <p className="text-[10px] font-bold tracking-widest text-indigo-100 uppercase">Twój wynik</p>
                <p className="mt-1 bg-gradient-to-b from-white to-indigo-100 bg-clip-text text-[2.2rem] leading-none font-black tracking-tight text-transparent md:text-[2.45rem]">
                  80%
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/12">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-300 via-indigo-200 to-violet-200 transition-[width] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                    style={{ width: analysisProgressWidth }}
                  />
                </div>
                <p className="mt-3 text-[11px] leading-snug text-indigo-100/75">8 z 10 poprawnych odpowiedzi</p>
              </div>

              <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-4 lg:p-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <TriangleAlert size={12} className="text-amber-300" />
                    <p className="text-[10px] font-bold tracking-wide text-amber-200 uppercase">Największa luka</p>
                  </div>
                  <p className="mt-1 text-xs leading-snug font-medium text-white/95">reakcje językowe</p>
                </div>

                <div className="mt-3.5 border-t border-white/12 pt-3.5">
                  <div className="flex items-center gap-1.5">
                    <Check size={12} className="text-emerald-300" />
                    <p className="text-[10px] font-bold tracking-wide text-emerald-200 uppercase">Mocna strona</p>
                  </div>
                  <p className="mt-1 text-xs leading-snug font-medium text-white/95">słownictwo codzienne</p>
                </div>

                <div className="mt-3.5 border-t border-white/12 pt-3.5">
                  <div className="flex items-center gap-1.5">
                    <Target size={12} className="text-indigo-300" />
                    <p className="text-[10px] font-bold tracking-wide text-indigo-200 uppercase">Skup się teraz na</p>
                  </div>
                  <p className="mt-1 text-xs leading-snug font-medium text-white">krótkich dialogach i reakcjach</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <header className="flex items-center justify-between border-b border-white/5 px-4 py-3 md:px-5 md:py-4">
              <div className="flex">
                <span className="inline-flex items-center gap-1 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[9px] font-bold tracking-wider text-indigo-200 uppercase">
                  ? Reakcje
                </span>
              </div>
              <div className="flex min-w-[96px] items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-300 transition-[width] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                    style={{ width: quizProgressWidth }}
                  />
                </div>
                <span className="text-base font-black tracking-tight text-white">{quizProgressValue}/10</span>
              </div>
            </header>

            <div className="p-4 md:p-4 lg:p-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm leading-relaxed font-bold text-white md:text-[0.96rem]">X: I&apos;m sorry I&apos;m late. The bus didn&apos;t arrive.</p>
                  <p className="text-sm font-bold text-white md:text-[0.96rem]">Y: ________</p>
                </div>

                <div className="space-y-1.5">
                  <div
                    className={`overflow-hidden transition-all duration-[200ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                      isExplaining ? "max-h-0 translate-y-2 opacity-0" : "max-h-16 translate-y-0 opacity-55"
                    }`}
                    aria-hidden={isExplaining}
                  >
                    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">A</span>
                        <span>It doesn&apos;t matter.</span>
                      </div>
                      <X size={14} className="text-red-500/40" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-white ring-1 ring-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-200">B</span>
                      <span className="font-semibold text-emerald-100">Never mind.</span>
                    </div>
                    <Check size={14} className="text-emerald-400" />
                  </div>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                    isExplaining ? "mt-1 max-h-[248px] translate-y-0 opacity-100 md:max-h-[286px]" : "max-h-0 translate-y-2 opacity-0"
                  }`}
                >
                  <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/[0.04] p-4 md:p-4 lg:p-4">
                    <div>
                      <p className="text-[9px] font-bold tracking-widest text-emerald-300 uppercase">DLACZEGO?</p>
                      <p className="mt-1.5 text-xs leading-relaxed font-normal text-white/92">Uspokajasz rozmówcę i pokazujesz, że nic się nie stało.</p>
                    </div>

                    <div className="mt-3.5 border-t border-white/10 pt-3.5">
                      <p className="text-[9px] font-bold tracking-widest text-blue-300 uppercase">WZORZEC</p>
                      <p className="mt-1.5 text-xs leading-relaxed font-normal text-white/92">Never mind. -&gt; nic nie szkodzi / nie przejmuj się.</p>
                    </div>

                    <div className="mt-3.5 border-t border-white/10 pt-3.5">
                      <p className="text-[9px] font-bold tracking-widest text-amber-300/85 uppercase">UWAGA</p>
                      <p className="mt-1.5 text-xs leading-relaxed font-normal text-white/78">Nie wybieraj odpowiedzi dosłownie - wybieraj odpowiedź pasującą do sytuacji.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}






