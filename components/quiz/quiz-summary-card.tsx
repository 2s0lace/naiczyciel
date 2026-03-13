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
  if (summary.scorePercent >= 85) {
    return "Bardzo dobry wynik. Utrzymaj tempo i domknij slabsze niuanse.";
  }

  if (summary.scorePercent >= 60) {
    return "Solidna baza. Jeden konkretny obszar do dopracowania podbije wynik.";
  }

  if (summary.scorePercent >= 40) {
    return "Masz fundament. Skup sie na najczestszych bledach i zrob szybki review.";
  }

  return "To byl trudny zestaw. Przejrzyj pytania i popraw jeden obszar na raz.";
}

function InsightCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: "good" | "focus";
  hint: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 xl:p-4">
      <p className="text-[10px] font-semibold tracking-[0.12em] text-gray-400 uppercase">{label}</p>
      <p className={`mt-1.5 text-sm font-semibold xl:text-[15px] ${tone === "good" ? "text-emerald-200" : "text-orange-200"}`}>{value}</p>
      <p className="mt-1 text-xs text-indigo-100/65 xl:text-[13px]">{hint}</p>
    </article>
  );
}

function PrimaryAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 py-3.5 text-center text-sm font-semibold text-white shadow-[0_14px_34px_-22px_rgba(59,130,246,0.8)] xl:py-[1.12rem]"
    >
      {label}
    </Link>
  );
}

function SecondaryAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block w-full rounded-2xl border border-white/15 bg-transparent py-3.5 text-center text-sm font-semibold text-indigo-100/90 xl:py-[1.12rem]"
    >
      {label}
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
  const prioritizeReview = summary.scorePercent < 65;
  const scoreBarWidth = `${Math.max(0, Math.min(100, summary.scorePercent))}%`;
  const [showPremiumUpsell, setShowPremiumUpsell] = useState(false);

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
    void resolveTierForUpsell();
  }, [resolveTierForUpsell]);

  return (
    <section className="mt-5 pb-8 xl:mt-6 xl:pb-10">
      <div className="space-y-4 xl:mx-auto xl:grid xl:max-w-[1120px] xl:grid-cols-[minmax(0,620px)_minmax(0,480px)] xl:items-start xl:gap-6 xl:space-y-0">
        <div className="space-y-4 xl:space-y-3.5">
          <section className="relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-[linear-gradient(158deg,rgba(19,23,48,0.9)_0%,rgba(10,12,27,0.9)_52%,rgba(8,9,22,0.92)_100%)] p-5 shadow-[0_30px_52px_-36px_rgba(76,86,170,0.7)] backdrop-blur-[2px] xl:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(129,140,248,0.23),transparent_48%),radial-gradient(circle_at_80%_110%,rgba(56,189,248,0.12),transparent_46%)]" />
            <div className="pointer-events-none absolute inset-px rounded-[1.65rem] border border-white/[0.07]" />
            <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-20px_32px_-22px_rgba(8,10,24,0.88)]" />

            <div className="relative">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-indigo-200/78 uppercase">Podsumowanie</p>
              <p className="mt-2.5 text-[3.45rem] leading-[0.9] font-black tracking-[-0.02em] text-white xl:mt-3 xl:text-[3.9rem]">{summary.scorePercent}%</p>
              <p className="mt-2 text-sm font-medium text-indigo-100/85 xl:mt-2.5 xl:text-[15px]">
                {summary.correctAnswers}/{summary.totalQuestions} poprawnych odpowiedzi
              </p>

              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10 xl:mt-3 xl:h-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-300/90 via-indigo-200/90 to-sky-200/90 transition-[width] duration-500"
                  style={{ width: scoreBarWidth }}
                />
              </div>

              <p className="mt-2.5 text-[13px] leading-5 text-indigo-100/75 xl:mt-3 xl:text-[14px] xl:leading-6">{interpretationText(summary)}</p>
            </div>

            <div className="relative mt-4 grid grid-cols-2 gap-3 xl:mt-5 xl:gap-3.5">
              <InsightCard
                label="Mocna strona"
                value={summary.strongestArea ?? "Brak danych"}
                tone="good"
                hint="Tu utrzymujesz najlepsza skutecznosc."
              />
              <InsightCard
                label="Do poprawy"
                value={summary.weakestArea ?? "Brak danych"}
                tone="focus"
                hint="To ten obszar najszybciej podniesie wynik."
              />
            </div>
          </section>

          <section className="space-y-2">
            {prioritizeReview ? (
              <>
                <PrimaryAction href={reviewHref} label="Przejrzyj pytania" />
                <SecondaryAction href={newSessionHref} label="Nowa sesja" />
              </>
            ) : (
              <>
                <PrimaryAction href={newSessionHref} label="Nowa sesja" />
                <SecondaryAction href={reviewHref} label="Przejrzyj pytania" />
              </>
            )}
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






