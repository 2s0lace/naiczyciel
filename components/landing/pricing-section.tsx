"use client";

import { useEffect, useRef, useState } from "react";

const LOGIN_TOAST_MS = 2600;
const EXAM_MONTH_INDEX = 4;
const EXAM_DAY = 15;

function getNextExamDate(baseDate: Date) {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);

  const candidate = new Date(today.getFullYear(), EXAM_MONTH_INDEX, EXAM_DAY);
  candidate.setHours(0, 0, 0, 0);

  if (candidate.getTime() >= today.getTime()) {
    return candidate;
  }

  const nextYearCandidate = new Date(today.getFullYear() + 1, EXAM_MONTH_INDEX, EXAM_DAY);
  nextYearCandidate.setHours(0, 0, 0, 0);
  return nextYearCandidate;
}

export default function PricingSection() {
  const [showLoginToast, setShowLoginToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const examDate = getNextExamDate(new Date());
  const daysToExam = Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / 86_400_000));
  const examDateLabel = examDate.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });

  const clearToastTimer = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearToastTimer();
  }, []);

  const handleSelectPlan = () => {
    clearToastTimer();
    setShowLoginToast(true);

    toastTimerRef.current = setTimeout(() => {
      setShowLoginToast(false);
      toastTimerRef.current = null;
    }, LOGIN_TOAST_MS);
  };

  return (
    <>
      <section id="pricing"
        className="mt-8 space-y-5 border-t border-white/5 pt-6 md:mt-9 md:space-y-6 md:pt-7 lg:mt-7 lg:space-y-5 lg:pt-6"
        aria-labelledby="pricing-heading"
      >
        <div className="mx-auto max-w-[42rem] space-y-2 text-center lg:max-w-[48rem] lg:space-y-2">
          <h2 id="pricing-heading" className="text-xl font-bold text-white md:text-[1.42rem] lg:text-[1.48rem]">
            Zacznij trenować już dziś
          </h2>
        </div>

        <div className="mx-auto grid w-full max-w-[860px] grid-cols-1 gap-4 min-[769px]:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <div className="relative min-[769px]:row-span-2">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.15)_0%,rgba(139,92,246,0)_68%)] animate-pulse [animation-duration:7s]"
            />
            <article className="relative overflow-hidden rounded-2xl border border-indigo-300/28 bg-[linear-gradient(165deg,rgba(49,46,129,0.3),rgba(15,23,42,0.9))] px-6 py-5 shadow-[0_16px_34px_-20px_rgba(99,102,241,0.56)]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-300">30 DNI</p>

            <div className="mt-2.5">
              <p className="text-lg font-semibold text-gray-400 line-through decoration-gray-500/70">29 zł</p>
              <p className="mt-0.5 text-4xl font-black tracking-tight text-white">24 zł</p>
            </div>

            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-gray-200">
              <li className="flex items-center gap-2">
                <span aria-hidden>⚡</span>
                <span>Nielimitowane zestawy</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden>🧠</span>
                <span>Inteligentny zestaw co 10 sesji</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden>📊</span>
                <span>Analiza mocnych i słabych stron</span>
              </li>
            </ul>

            <div className="mt-5">
              <button
                type="button"
                onClick={handleSelectPlan}
                className="w-full rounded-xl border border-indigo-300/40 bg-indigo-500 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_-14px_rgba(99,102,241,0.7)] transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out hover:bg-indigo-400 hover:shadow-[0_14px_26px_-14px_rgba(99,102,241,0.8)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/40 motion-reduce:transform-none"
              >
                Zacznij za 24 zł
              </button>
            </div>
            </article>
          </div>

          <article className="rounded-2xl border border-white/12 bg-[linear-gradient(160deg,rgba(18,25,46,0.92),rgba(9,14,30,0.92))] px-6 py-5 shadow-[0_14px_28px_-22px_rgba(0,0,0,0.9)]">
            <p className="text-sm font-semibold text-white">🔥 Ćwicz 15 min dziennie</p>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-300">Krótka, regularna sesja daje lepszy efekt niż długie zrywy.</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/12">
              <div className="h-full w-[62%] rounded-full bg-cyan-300/80" />
            </div>
            <p className="mt-1.5 text-[11px] text-cyan-100/70">Jesteś na 62% tygodniowego celu.</p>
          </article>

          <article className="rounded-2xl border border-white/12 bg-[linear-gradient(160deg,rgba(18,25,46,0.92),rgba(9,14,30,0.92))] px-6 py-5 shadow-[0_14px_28px_-22px_rgba(0,0,0,0.9)]">
            <p className="text-sm font-semibold text-white">📅 Do egzaminu zostało {daysToExam} dni</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-white">{daysToExam}</p>
            <p className="mt-1 text-xs text-gray-300">Planowana data: {examDateLabel}</p>
          </article>
        </div>

        <p className="text-center text-[11px] text-gray-300 md:text-xs">Bezpieczna płatność • Aktywacja od razu</p>
      </section>

      <div
        className={`pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 transition-[opacity,transform] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          showLoginToast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="rounded-xl border border-indigo-200/30 bg-[#0a1020]/94 px-4 py-2.5 text-sm font-medium text-indigo-100 shadow-[0_14px_30px_-20px_rgba(0,0,0,0.9)] backdrop-blur">
          Musisz się zalogować, aby kupić plan.
        </div>
      </div>
    </>
  );
}
