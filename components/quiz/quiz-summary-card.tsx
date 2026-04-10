"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { QuizOpenAIFeedbackPanel } from "@/components/quiz/quiz-openai-feedback-panel";
import type { QuizSummary } from "@/lib/quiz/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type QuizSummaryCardProps = {
  summary: QuizSummary;
  sessionId: string;
  mode: string;
};

type AccessTier = "unregistered" | "registered" | "premium" | "premium_plus";

type SetAccessResponse = {
  tier?: AccessTier;
};

function interpretationText(summary: QuizSummary): string {
  if (summary.scorePercent >= 100) {
    return "Perfekcyjny wynik. Czas na trudniejszy materiał.";
  }

  if (summary.scorePercent >= 75) {
    return "Solidna robota. Jeszcze jeden review i będzie perfekcja.";
  }

  if (summary.scorePercent >= 50) {
    return "Dobry start. Wróć do błędów i powtórz słabe punkty.";
  }

  return "Trudny materiał. Skup się na lukach i spróbuj ponownie.";
}

function PrimaryAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block h-[52px] w-full rounded-[14px] border border-[#7B74FF] bg-[#5B52E8] px-4 text-center text-[15px] font-semibold tracking-[0.02em] leading-[52px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-colors hover:bg-[#645cf0]"
    >
      {label}
    </Link>
  );
}

function TextAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-1 text-[14px] font-medium text-white/50 transition-colors hover:text-white"
    >
      {label}
      <span aria-hidden>›</span>
    </Link>
  );
}

function resolveUpsellNudge(summary: QuizSummary): string {
  const missing = Math.max(0, summary.totalQuestions - summary.correctAnswers);

  if (missing === 1) {
    return "Brakuje Ci tylko 1 punktu. Premium daje więcej pytań i wsparcie AI, żeby domknąć wynik.";
  }

  if (summary.scorePercent >= 80) {
    return "Masz mocny wynik. Premium daje więcej ćwiczeń i AI, żeby utrzymać poziom.";
  }

  if (summary.weakestArea) {
    return `${summary.weakestArea}: w Premium masz więcej pytań i wsparcie AI, żeby ten obszar domknąć.`;
  }

  return "Przejdź dalej niż darmowy skrót: więcej pytań, więcej ćwiczeń i dostęp do AI.";
}

function LockedValueRow({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 py-3 text-[13px] text-indigo-100/92 xl:py-3.5 xl:text-[14px]">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/16 bg-white/[0.04] text-indigo-100/82">
        <LockKeyhole className="h-3.5 w-3.5" />
      </span>
      <span>{text}</span>
    </li>
  );
}

function QuizPremiumUpsell({ visible, summary }: { visible: boolean; summary: QuizSummary }) {
  if (!visible) {
    return null;
  }

  const nudgeLine = resolveUpsellNudge(summary);

  return (
    <section className="mt-6 rounded-3xl border border-indigo-300/24 bg-[linear-gradient(160deg,rgba(20,24,49,0.94)_0%,rgba(10,13,30,0.96)_55%,rgba(8,10,24,0.98)_100%)] p-5 shadow-[0_28px_48px_-38px_rgba(79,70,229,0.72)] xl:mt-7 xl:p-6">
      <div className="xl:hidden">
        <p className="text-[10px] font-semibold tracking-[0.15em] text-indigo-200/85 uppercase">ODBLOKUJ WIĘCEJ</p>
        <h3 className="mt-2 text-[1.4rem] leading-tight font-bold text-white">Ćwicz dalej bez ograniczeń</h3>
        <p className="mt-2.5 text-sm leading-relaxed text-indigo-100/82">
          Odblokuj więcej pytań, więcej ćwiczeń i pełniejsze wsparcie po sesji.
        </p>

        <ul className="mt-4 border-y border-white/12 divide-y divide-white/12">
          <LockedValueRow text="Większa baza pytań" />
          <LockedValueRow text="Więcej quizów i ćwiczeń" />
          <LockedValueRow text="AI po sesji" />
        </ul>

        <Link
          href="/e8#pricing-heading"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 py-3.5 text-center text-sm font-semibold text-white shadow-[0_14px_34px_-22px_rgba(59,130,246,0.8)] transition-transform duration-150 active:scale-[0.99]"
        >
          Odblokuj nasz plan
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="hidden xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] xl:items-stretch xl:gap-8">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.15em] text-indigo-200/85 uppercase">Premium / Odblokuj więcej</p>
          <h3 className="mt-2 text-[1.4rem] leading-tight font-bold text-white xl:max-w-[26ch] xl:text-[1.62rem]">
            Odblokuj pełniejszą analizę i więcej pytań.
          </h3>
          <p className="mt-2.5 max-w-[64ch] text-sm leading-relaxed text-indigo-100/82 xl:text-[15px]">
            W Premium odblokujesz więcej pytań, więcej ćwiczeń i lepsze wsparcie po sesji.
          </p>

          <ul className="mt-4 border-y border-white/12 divide-y divide-white/12">
            <LockedValueRow text="Większa baza pytań" />
            <LockedValueRow text="Więcej quizów i ćwiczeń" />
            <LockedValueRow text="Dostęp do AI po sesji" />
          </ul>
        </div>

        <div className="xl:border-l xl:border-white/10 xl:pl-6 xl:flex xl:flex-col xl:justify-center xl:translate-y-4">
          <p className="text-[10px] font-semibold tracking-[0.13em] text-indigo-200/78 uppercase">Twój następny krok po quizie</p>
          <p className="mt-2 text-[13px] leading-relaxed text-indigo-100/88 xl:text-[14px]">{nudgeLine}</p>

          <Link
            href="/e8#pricing-heading"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 py-3.5 text-center text-sm font-semibold text-white shadow-[0_14px_34px_-22px_rgba(59,130,246,0.8)] transition-transform duration-150 active:scale-[0.99] xl:py-[1.12rem]"
          >
            Odblokuj Premium
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function QuizSummaryCard({ summary, sessionId, mode }: QuizSummaryCardProps) {
  const reviewHref = `/e8/quiz/${encodeURIComponent(sessionId)}?mode=${encodeURIComponent(mode)}&review=1`;
  const newSessionHref = `/e8/quiz?mode=${encodeURIComponent(mode)}`;
  const panelHref = "/e8";
  const [showPremiumUpsell, setShowPremiumUpsell] = useState(false);
  const progressSegments = Array.from({ length: summary.totalQuestions }, (_, index) => index < summary.correctAnswers);

  const resolveTierForUpsell = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setShowPremiumUpsell(true);
        return;
      }

      const response = await fetch("/api/e8/set-access", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setShowPremiumUpsell(false);
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as SetAccessResponse;
      const tier = payload.tier;

      setShowPremiumUpsell(tier === "unregistered" || tier === "registered");
    } catch {
      setShowPremiumUpsell(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void resolveTierForUpsell();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [resolveTierForUpsell]);

  return (
    <section className="mt-4 pb-8 xl:mt-6 xl:pb-8">
      <div className="space-y-9 xl:mx-auto xl:grid xl:max-w-[1120px] xl:grid-cols-[minmax(0,620px)_minmax(0,480px)] xl:items-start xl:gap-8 xl:space-y-0">
        <div className="space-y-7">
          <section className="relative px-0 py-1">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-8 -top-5 h-36 w-52 bg-[radial-gradient(ellipse_50%_40%_at_20%_20%,#3d35a820_0%,transparent_70%)]"
            />
            <div className="relative flex items-end justify-between gap-4">
              <p className="text-[80px] leading-none font-extrabold tracking-[-3px] text-white">{summary.scorePercent}%</p>
              <div className="pb-1 text-right">
                <p className="text-[40px] leading-none font-bold tracking-[-0.04em] text-white">
                  {summary.correctAnswers}/{summary.totalQuestions}
                </p>
                <p className="mt-1 text-[12px] font-medium tracking-[0.02em] text-white/42">poprawnych odpowiedzi</p>
              </div>
            </div>

            <div className="mt-5 flex w-full gap-1.5">
              {progressSegments.map((filled, index) => (
                <span
                  key={`summary-segment-${index}`}
                  className={`h-1.5 flex-1 rounded-full ${filled ? "bg-[#6C63FF]" : "bg-white/14"}`}
                />
              ))}
            </div>

            <p className="mt-5 max-w-[34ch] text-[14px] leading-[1.6] text-white/55">{interpretationText(summary)}</p>
          </section>

          <section className="relative overflow-hidden rounded-[18px]">
            <div className="group relative flex cursor-pointer items-center justify-between gap-4 px-4 py-[14px] transition-colors hover:bg-white/[0.05]">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300/90" />
                <span className="text-[12px] font-medium tracking-[0.04em] text-white/42">Mocna strona</span>
              </div>
              <span className="inline-flex items-center gap-1 text-right text-[14px] font-medium text-white">
                {summary.strongestArea ?? "Brak danych"}
                <span className="text-[#6C63FF]">›</span>
              </span>
            </div>
            <div className="relative h-px bg-white/[0.08]" />
            <div className="group relative flex cursor-pointer items-center justify-between gap-4 px-4 py-[14px] transition-colors hover:bg-white/[0.05]">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300/90" />
                <span className="text-[12px] font-medium tracking-[0.04em] text-white/42">Do poprawy</span>
              </div>
              <span className="inline-flex items-center gap-1 text-right text-[14px] font-medium text-white">
                {summary.weakestArea ?? "Brak danych"}
                <span className="text-[#6C63FF]">›</span>
              </span>
            </div>
          </section>

          <section className="space-y-3.5 pt-2">
            <PrimaryAction href={newSessionHref} label="Nowa sesja" />
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-0.5">
              <TextAction href={reviewHref} label="Przejrzyj pytania" />
              <TextAction href={panelHref} label="Wróć do panelu" />
            </div>
          </section>
        </div>

        <div>
          <QuizOpenAIFeedbackPanel sessionId={sessionId} mode={mode} summary={summary} />
        </div>
      </div>

      <div className="xl:mx-auto xl:max-w-[1120px]">
        <QuizPremiumUpsell visible={showPremiumUpsell} summary={summary} />
      </div>
    </section>
  );
}






