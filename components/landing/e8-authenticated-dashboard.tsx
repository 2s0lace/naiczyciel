"use client";

import {
  ArrowRight,
  ChartNoAxesColumn,
  ChevronDown,
  GraduationCap,
  ChevronRight,
  Dumbbell,
  ListChecks,
  Play,
  Sparkles,
  Target,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardOnboarding, {
  type DashboardOnboardingStep,
} from "@/components/landing/dashboard-onboarding";
import MobileHeader from "@/components/landing/mobile-header";
import { SocialLinks } from "@/components/layout/social-links";
import type { DashboardPayload, DashboardSession, DashboardStats } from "@/lib/quiz/dashboard-types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AuthenticatedDashboardProps = {
  accessToken: string;
  userDisplayName: string;
  shouldRunOnboarding: boolean;
};

type AccentPreset = "hero" | "progress" | "premium";

type CardAccentProps = {
  preset: AccentPreset;
  className?: string;
};

type NextStepAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
};

type DashboardPlanOffer = {
  id: string;
  name: string;
  price: string;
  description: string;
  featured?: boolean;
};

type AiSummaryResponse = {
  ok?: boolean;
  summary?: string;
  sessionsUsed?: number;
  generatedAt?: string;
  refreshLockedUntil?: string | null;
  canRefreshNow?: boolean;
  notice?: string;
  error?: string;
};

const DASHBOARD_PLAN_OFFERS: DashboardPlanOffer[] = [
  {
    id: "plan-3-days",
    name: "3 DNI",
    price: "5 zl",
    description: "Na szybki start i krotkie powtorki.",
  },
  {
    id: "plan-7-days",
    name: "7 DNI",
    price: "11 zl",
    description: "Na intensywny tydzien nauki przed sprawdzianem lub egzaminem.",
  },
  {
    id: "plan-30-days",
    name: "30 DNI",
    price: "24 zl",
    description: "Najlepsza opcja do regularnej nauki i spokojnego przerabiania materialu.",
    featured: true,
  },
];


const PREMIUM_MODAL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const PREMIUM_MODAL_STAGGER = 0.055;

const CARD_ACCENT_ASSETS: Partial<Record<AccentPreset, string>> = {
  hero: "",
  progress: "",
  premium: "",
};

const MODE_LABEL: Record<string, string> = {
  reactions: "Reakcje",
  vocabulary: "Slownictwo",
  grammar: "Gramatyka",
};

const DASHBOARD_ONBOARDING_STEPS: DashboardOnboardingStep[] = [
  {
    id: "welcome",
    target: "[data-tour=\"dashboard-welcome\"]",
    title: "Witaj w panelu",
    text: "Tutaj zaczynasz krotkie treningi i sledzisz postepy.",
  },
  {
    id: "cta",
    target: "[data-tour=\"dashboard-start-cta\"]",
    title: "Start sesji",
    text: "Kliknij tutaj, aby rozpoczac pierwsza sesje.",
  },
  {
    id: "result",
    target: "[data-tour=\"dashboard-latest-result\"]",
    title: "Ostatni wynik",
    text: "Po zakonczeniu sesji zobaczysz tu punkty, procent i czas.",
  },
  {
    id: "progress",
    target: "[data-tour=\"dashboard-progress\"]",
    title: "Postep",
    text: "Tutaj pojawia sie Twoje mocne strony i obszary do poprawy.",
  },
  {
    id: "account",
    target: "[data-tour=\"dashboard-account\"]",
    title: "Konto i ustawienia",
    text: "Tutaj zmienisz avatar i ustawienia konta.",
  },
];
function normalizeMode(mode: string): string {
  return mode.trim().toLowerCase();
}

function formatMode(mode: string): string {
  const raw = mode.trim();
  const normalized = normalizeMode(raw);
  const mapped = MODE_LABEL[normalized];

  if (mapped) {
    return mapped;
  }

  if (!normalized) {
    return "Reakcje";
  }

  const pretty = normalized
    .replace(/_/g, " ")
    .split(" ")
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");

  return pretty || "Reakcje";
}

function formatSessionDate(session: DashboardSession): string {
  const source = session.completedAt ?? session.startedAt ?? session.createdAt;

  if (!source) {
    return "Brak daty";
  }

  const date = new Date(source);

  if (Number.isNaN(date.getTime())) {
    return "Brak daty";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function estimateDurationLabel(questionCount: number): string {
  const min = Math.max(6, Math.round(questionCount * 0.55));
  const max = Math.max(min + 2, Math.round(questionCount * 0.85));
  return `${min}-${max} min`;
}

function formatDurationLabel(value: number | null): string | null {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  if (value < 1) {
    return "<1 min";
  }

  const formatted = new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

  return `${formatted} min`;
}

function sessionHref(session: DashboardSession): string {
  const id = encodeURIComponent(session.id);
  const params = new URLSearchParams({
    mode: session.mode || "reactions",
  });

  const normalizedSetId = typeof session.setId === "string" ? session.setId.trim() : "";

  if (normalizedSetId.length > 0) {
    params.set("set", normalizedSetId);
  }

  if (session.status === "completed") {
    params.set("review", "1");
  }

  return `/e8/quiz/${id}?${params.toString()}`;
}

type HeroIntroCopy = {
  headline: string;
  line1: string;
  line2: string;
};

type DashboardStatTile = {
  label: string;
  value: string;
  note: string;
  isTrendingUp?: boolean;
};

type ProgressStatsLayout = {
  score: DashboardStatTile;
  sessions: DashboardStatTile;
  questions: DashboardStatTile;
  duration: DashboardStatTile;
};

const SESSION_HISTORY_LIMIT = 3;
const INTELLIGENT_SET_UNLOCK_SESSIONS = 10;
const INTELLIGENT_SET_QUESTION_COUNT = 5;
const START_SET_ROTATION_STORAGE_KEY = "e8_dashboard_start_set_rotation_v1";
const SENTENCE_SPLIT_PATTERN = /(?<=[.!?])\s+/;

const TUTORIAL_HERO_STATES: HeroIntroCopy[] = [
  {
    headline: "Witaj",
    line1: "Zacznij od pierwszej sesji.",
    line2: "Po niej zobaczysz, co juz umiesz i nad czym warto jeszcze popracowac.",
  },
  {
    headline: "Pierwszy progres",
    line1: "Masz juz zrobiony pierwszy krok.",
    line2: "Krotkie sesje pokaza Ci mocne strony i obszary do poprawy.",
  },
  {
    headline: "Trzymaj tempo",
    line1: "Regularny trening daje najlepszy efekt.",
    line2: "Po kazdej sesji dostaniesz jasny wynik i kolejne wskazowki.",
  },
];

const TUTORIAL_LATEST_RESULT_STATES: Array<{
  scoreOutOfTen: string;
  scorePercent: string;
  duration: string;
  note: string;
}> = [
  {
    scoreOutOfTen: "6/10",
    scorePercent: "60%",
    duration: "8.3 min",
    note: "Przyklad wyniku po pierwszej sesji.",
  },
  {
    scoreOutOfTen: "7/10",
    scorePercent: "70%",
    duration: "7.6 min",
    note: "Z kazda sesja widzisz postep i tempo pracy.",
  },
  {
    scoreOutOfTen: "8/10",
    scorePercent: "80%",
    duration: "7.1 min",
    note: "Po quizie pojawia sie tu najnowsze podsumowanie.",
  },
];

const TUTORIAL_PROGRESS_INSIGHTS: string[] = [
  "Tu zobaczysz wynik i krotkie podsumowanie po sesji.",
  "Statystyki aktualizuja sie po kazdym zakonczonym quizie.",
  "Mocna strona i obszar do poprawy pojawia sie automatycznie.",
];

const TUTORIAL_STAT_TILE_STATES: DashboardStatTile[][] = [
  [
    { label: "Srednia skutecznosc", value: "62%", note: "aktualny trend", isTrendingUp: true },
    { label: "Ukonczone sesje", value: "1", note: "zamkniete treningi", isTrendingUp: true },
    { label: "Rozwiazane pytania", value: "10", note: "w zakonczonych sesjach", isTrendingUp: true },
    { label: "Sredni czas sesji", value: "8.3 min", note: "tempo pracy", isTrendingUp: true },
  ],
  [
    { label: "Srednia skutecznosc", value: "71%", note: "aktualny trend" },
    { label: "Ukonczone sesje", value: "2", note: "zamkniete treningi" },
    { label: "Rozwiazane pytania", value: "20", note: "w zakonczonych sesjach" },
    { label: "Sredni czas sesji", value: "7.8 min", note: "tempo pracy" },
  ],
  [
    { label: "Srednia skutecznosc", value: "78%", note: "aktualny trend" },
    { label: "Ukonczone sesje", value: "3", note: "zamkniete treningi" },
    { label: "Rozwiazane pytania", value: "30", note: "w zakonczonych sesjach" },
    { label: "Sredni czas sesji", value: "7.2 min", note: "tempo pracy" },
  ],
];

const TUTORIAL_MODE_STATES: Array<{ strongest: string; weakest: string }> = [
  { strongest: "Reakcje", weakest: "Gramatyka" },
  { strongest: "Slownictwo", weakest: "Czasy" },
  { strongest: "Czytanie", weakest: "Przyimki" },
];

const TUTORIAL_ACTIVITY_STATES: string[] = [
  "Tutaj pojawi sie podsumowanie ostatniego quizu.",
  "Po pierwszej sesji zobaczysz date, wynik i czas.",
  "Historia treningow bedzie rosla z kazda sesja.",
];

const TUTORIAL_PROMO_STATES: string[] = [
  "Odblokuj dostep do treningow E8, wynikow i krotkich wyjasnien.",
  "Premium daje wiecej quizow, pytan i wsparcia po sesji.",
  "Po aktywacji planu od razu ruszasz z pelnym dostepem.",
];

const TUTORIAL_UCZEN_PLUS_STATES: string[] = [
  "Nowe opcje nauki pojawia sie juz wkrotce.",
  "Pracujemy nad dodatkowymi modulami dla ucznia.",
  "Wkrotce udostepnimy kolejne funkcje panelu.",
];

const STATS_DECORATIVE_ARROWS: Array<{ top: number; left: number; opacity: number; size: number; blur?: number }> = [
  { top: 12, left: 18, opacity: 0.46, size: 16 },
  { top: 11, left: 41, opacity: 0.52, size: 18 },
  { top: 13, left: 67, opacity: 0.4, size: 15, blur: 0.2 },
  { top: 30, left: 23, opacity: 0.42, size: 17 },
  { top: 35, left: 51, opacity: 0.48, size: 18 },
  { top: 31, left: 76, opacity: 0.38, size: 16, blur: 0.3 },
  { top: 51, left: 17, opacity: 0.5, size: 19 },
  { top: 57, left: 43, opacity: 0.4, size: 16, blur: 0.4 },
  { top: 54, left: 71, opacity: 0.46, size: 18 },
  { top: 76, left: 24, opacity: 0.47, size: 17 },
  { top: 81, left: 53, opacity: 0.36, size: 15, blur: 0.3 },
  { top: 79, left: 78, opacity: 0.44, size: 16 },
];

function resolveHeroIntroCopy(completedSessionsRaw: number | null | undefined): HeroIntroCopy {
  const completedSessions =
    typeof completedSessionsRaw === "number" && Number.isFinite(completedSessionsRaw)
      ? Math.max(0, Math.floor(completedSessionsRaw))
      : 0;

  if (completedSessions === 0) {
    return {
      headline: "Witaj",
      line1: "Zacznij od pierwszej sesji.",
      line2: "Po niej zobaczysz, co juz umiesz i nad czym warto jeszcze popracowac.",
    };
  }

  if (completedSessions === 1) {
    return {
      headline: "Pierwsza sesja za Toba",
      line1: "Masz juz pierwszy wynik i punkt odniesienia do kolejnych treningow.",
      line2: "Teraz najwiecej da regularne cwiczenie kolejnych zestawow.",
    };
  }

  if (completedSessions <= 3) {
    return {
      headline: "Lapiesz juz rytm",
      line1: "Masz za soba pierwsze sesje i widac, co idzie Ci lepiej.",
      line2: "Cwicz dalej, zeby utrwalic mocne strony i poprawic slabsze obszary.",
    };
  }

  return {
    headline: "Budujesz regularny progres",
    line1: "Masz juz kilka sesji za soba i coraz wyrazniej widac Twoj postep.",
    line2: "Kontynuuj trening, zeby utrzymac tempo i poprawiac wynik krok po kroku.",
  };
}

function buildProgressInsight(stats: DashboardStats | null | undefined): string {
  void stats;
  return "Sprawd\u017a wbite procenty";
}

type SectionIconTone = "indigo" | "amber" | "sky" | "violet" | "emerald";

function SectionIcon({ icon: Icon, tone = "indigo" }: { icon: LucideIcon; tone?: SectionIconTone }) {
  const toneClasses: Record<SectionIconTone, string> = {
    indigo: "border-white/14 bg-white/[0.05] text-indigo-100/90",
    amber: "border-amber-300/26 bg-amber-400/10 text-amber-100",
    sky: "border-sky-300/26 bg-sky-400/10 text-sky-100",
    violet: "border-violet-300/26 bg-violet-400/10 text-violet-100",
    emerald: "border-emerald-300/26 bg-emerald-400/10 text-emerald-100",
  };

  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        toneClasses[tone],
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

function SkeletonWave({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex rounded-md border border-white/12 bg-[linear-gradient(110deg,rgba(255,255,255,0.05),rgba(255,255,255,0.18),rgba(255,255,255,0.05))] bg-[length:220%_100%] dashboard-wave",
        className,
      )}
    />
  );
}

function CardAccent({ preset, className }: CardAccentProps) {
  const assetUrl = CARD_ACCENT_ASSETS[preset];

  if (assetUrl && assetUrl.trim().length > 0) {
    return (
      <img
        src={assetUrl}
        alt=""
        aria-hidden
        className={cn("pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20", className)}
      />
    );
  }

  if (preset === "hero") {
    return (
      <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
        <svg viewBox="0 0 260 180" className="absolute -right-8 -top-10 h-44 w-64 text-indigo-200/20" fill="none">
          <circle cx="164" cy="86" r="54" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="164" cy="86" r="36" stroke="currentColor" strokeWidth="1" />
          <path d="M24 34h76M24 56h54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M130 132h102" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M198 32l18 18-18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (preset === "progress") {
    return (
      <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
        <svg viewBox="0 0 220 160" className="absolute -right-5 -top-6 h-36 w-52 text-indigo-200/16" fill="none">
          <path d="M12 134h196" stroke="currentColor" strokeWidth="1.2" />
          <rect x="48" y="76" width="14" height="58" rx="6" fill="currentColor" />
          <rect x="76" y="56" width="14" height="78" rx="6" fill="currentColor" />
          <rect x="104" y="88" width="14" height="46" rx="6" fill="currentColor" />
          <path d="M16 52c24-18 54-22 82-10 13 5 24 13 35 16 19 5 39-2 60-18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <svg viewBox="0 0 260 160" className="absolute -right-7 -top-7 h-40 w-64 text-indigo-100/16" fill="none">
        <path d="M18 136h224" stroke="currentColor" strokeWidth="1.2" />
        <path d="M38 100l32-32 30 28 42-44 36 33 30-26" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="70" cy="68" r="3" fill="currentColor" />
        <circle cx="142" cy="52" r="3" fill="currentColor" />
        <circle cx="214" cy="59" r="3" fill="currentColor" />
      </svg>
    </div>
  );
}

export default function E8AuthenticatedDashboard({
  accessToken,
  userDisplayName,
  shouldRunOnboarding,
}: AuthenticatedDashboardProps) {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(shouldRunOnboarding);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);
  const [aiSummaryRefreshLockedUntil, setAiSummaryRefreshLockedUntil] = useState<string | null>(null);
  const [aiSummaryNotice, setAiSummaryNotice] = useState<string | null>(null);
  const [aiSummaryExpandedMobile, setAiSummaryExpandedMobile] = useState(false);
  const [startSetRotationIndex, setStartSetRotationIndex] = useState(0);
  const [isSessionHistoryOpen, setIsSessionHistoryOpen] = useState(false);
  const [progressViewTab, setProgressViewTab] = useState<"stats" | "chart">("stats");

  const prefersReducedMotion = useReducedMotion();

  const modalMotion = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        backdropDuration: 0.01,
        modalDuration: 0.01,
        cardDuration: 0.01,
        cardStagger: 0,
        cardHover: undefined,
        buttonHover: undefined,
        buttonTap: undefined,
      };
    }

    return {
      backdropDuration: 0.2,
      modalDuration: 0.24,
      cardDuration: 0.22,
      cardStagger: PREMIUM_MODAL_STAGGER,
      cardHover: {
        y: -2,
        scale: 1.01,
        transition: { duration: 0.22, ease: PREMIUM_MODAL_EASE },
      },
      buttonHover: {
        scale: 1.01,
        filter: "brightness(1.04)",
        transition: { duration: 0.2, ease: PREMIUM_MODAL_EASE },
      },
      buttonTap: {
        scale: 0.98,
        transition: { duration: 0.12, ease: PREMIUM_MODAL_EASE },
      },
    };
  }, [prefersReducedMotion]);
  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/e8/dashboard", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`dashboard_request_failed:${response.status}`);
        }

        const payload = (await response.json()) as DashboardPayload;

        if (!active) {
          return;
        }

        setData(payload);
      } catch {
        if (!active) {
          return;
        }

        setLoadError("Nie udalo sie pobrac danych dashboardu.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [accessToken]);

  useEffect(() => {
    if (shouldRunOnboarding) {
      setOnboardingVisible(true);
    }
  }, [shouldRunOnboarding]);

  useEffect(() => {
    if (!plansModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPlansModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [plansModalOpen]);

  const stats = data?.stats;
  const recentSessions = useMemo(() => data?.recentSessions ?? [], [data?.recentSessions]);
  const visibleSets = useMemo(() => data?.visibleSets ?? [], [data?.visibleSets]);
  const weakestMode = stats?.weakestMode ?? null;

  const recommendedSet = useMemo(() => {
    if (visibleSets.length === 0) {
      return null;
    }

    if (weakestMode) {
      const exact = visibleSets.find((setItem) => normalizeMode(setItem.mode) === normalizeMode(weakestMode));

      if (exact) {
        return exact;
      }
    }

    return visibleSets[0] ?? null;
  }, [visibleSets, weakestMode]);

  const statTiles = useMemo(() => {
    const completedForTrend = recentSessions.filter(
      (session) => session.status === "completed" || session.scorePercent !== null,
    );
    const latestScoreTrend =
      completedForTrend[0]?.scorePercent !== null && completedForTrend[0]?.scorePercent !== undefined
        ? Number(completedForTrend[0]?.scorePercent)
        : null;
    const previousScoreTrend =
      completedForTrend[1]?.scorePercent !== null && completedForTrend[1]?.scorePercent !== undefined
        ? Number(completedForTrend[1]?.scorePercent)
        : null;

    const completedWithDuration = completedForTrend.filter(
      (session) => session.durationMinutes !== null && Number.isFinite(session.durationMinutes),
    );
    const latestDurationTrend =
      completedWithDuration[0]?.durationMinutes !== null && completedWithDuration[0]?.durationMinutes !== undefined
        ? Number(completedWithDuration[0]?.durationMinutes)
        : null;
    const previousDurationTrend =
      completedWithDuration[1]?.durationMinutes !== null && completedWithDuration[1]?.durationMinutes !== undefined
        ? Number(completedWithDuration[1]?.durationMinutes)
        : null;

    const sessionsCompletedTrendingUp = (stats?.sessionsCompleted ?? 0) > 0;
    const solvedQuestionsTrendingUp = (stats?.solvedQuestions ?? 0) > 0;
    const averageScoreTrendingUp =
      latestScoreTrend !== null && previousScoreTrend !== null && latestScoreTrend > previousScoreTrend;
    const averageDurationTrendingUp =
      latestDurationTrend !== null && previousDurationTrend !== null && latestDurationTrend > previousDurationTrend;

    if (!stats) {
      return [
        {
          label: "Ukonczone sesje",
          value: "0",
          note: "zamkniete treningi",
          isTrendingUp: false,
        },
        {
          label: "Rozwiazane pytania",
          value: "0",
          note: "w zakonczonych sesjach",
          isTrendingUp: false,
        },
      ] as DashboardStatTile[];
    }

    const items: DashboardStatTile[] = [
      {
        label: "Ukonczone sesje",
        value: String(stats.sessionsCompleted),
        note: "zamkniete treningi",
        isTrendingUp: sessionsCompletedTrendingUp,
      },
      {
        label: "Rozwiazane pytania",
        value: String(stats.solvedQuestions),
        note: "w zakonczonych sesjach",
        isTrendingUp: solvedQuestionsTrendingUp,
      },
    ];

    if (stats.averageScorePercent !== null) {
      items.unshift({
        label: "Srednia skutecznosc",
        value: `${Math.round(stats.averageScorePercent)}%`,
        note: "aktualny trend",
        isTrendingUp: averageScoreTrendingUp,
      });
    }

    if (stats.averageDurationMinutes !== null) {
      items.push({
        label: "Sredni czas sesji",
        value: formatDurationLabel(stats.averageDurationMinutes) ?? "--",
        note: "tempo pracy",
        isTrendingUp: averageDurationTrendingUp,
      });
    }

    return items;
  }, [recentSessions, stats]);
  const inProgressSession = useMemo(
    () =>
      recentSessions.find(
        (session) =>
          session.status === "in_progress" &&
          session.completedAt === null &&
          (session.scorePercent === null || !Number.isFinite(session.scorePercent)),
      ) ?? null,
    [recentSessions],
  );

  const latestCompletedSession = useMemo(
    () => recentSessions.find((session) => session.status === "completed" || session.scorePercent !== null) ?? null,
    [recentSessions],
  );
  const latestSessionWithDuration = useMemo(
    () =>
      recentSessions.find(
        (session) =>
          (session.status === "completed" || session.scorePercent !== null) &&
          session.durationMinutes !== null &&
          Number.isFinite(session.durationMinutes) &&
          session.durationMinutes > 0,
      ) ?? null,
    [recentSessions],
  );

  const rotatingStartSets = useMemo(() => {
    const next: typeof visibleSets = [];
    const seen = new Set<string>();

    const pushUnique = (setItem: (typeof visibleSets)[number] | null) => {
      if (!setItem || seen.has(setItem.id)) {
        return;
      }

      seen.add(setItem.id);
      next.push(setItem);
    };

    pushUnique(recommendedSet);

    for (const setItem of visibleSets) {
      pushUnique(setItem);

      if (next.length >= 2) {
        break;
      }
    }

    return next;
  }, [recommendedSet, visibleSets]);

  useEffect(() => {
    if (rotatingStartSets.length <= 1) {
      setStartSetRotationIndex(0);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(START_SET_ROTATION_STORAGE_KEY);
    const parsed = Number.parseInt(raw ?? "0", 10);
    const nextIndex = Number.isFinite(parsed) && parsed >= 0 ? parsed % rotatingStartSets.length : 0;
    setStartSetRotationIndex(nextIndex);
  }, [rotatingStartSets]);

  const activeStartSet =
    rotatingStartSets[rotatingStartSets.length > 0 ? startSetRotationIndex % rotatingStartSets.length : 0] ??
    recommendedSet ??
    visibleSets[0] ??
    null;

  const handleStartSessionClick = useCallback(() => {
    if (rotatingStartSets.length <= 1 || typeof window === "undefined") {
      return;
    }

    const nextIndex = (startSetRotationIndex + 1) % rotatingStartSets.length;
    setStartSetRotationIndex(nextIndex);
    window.localStorage.setItem(START_SET_ROTATION_STORAGE_KEY, String(nextIndex));
  }, [rotatingStartSets.length, startSetRotationIndex]);

  const primaryMode = activeStartSet?.mode ?? "reactions";
  const primarySetId = activeStartSet?.id ?? null;
  const startHrefParams = new URLSearchParams({ mode: primaryMode });
  if (primarySetId) {
    startHrefParams.set("set", primarySetId);
  }
  const startHref = `/e8/quiz?${startHrefParams.toString()}`;
  const resumeSessionHref = inProgressSession ? sessionHref(inProgressSession) : null;
  const primarySessionHref = resumeSessionHref ?? startHref;
  const primarySessionCtaLabel = resumeSessionHref ? "Wznow sesje" : "Zacznij sesje";
  const primaryStatsCtaLabel = resumeSessionHref ? "Wznow sesje" : "Start pierwszej sesji";
  const progressInsight = buildProgressInsight(stats);
  const latestScorePercent = latestCompletedSession?.scorePercent ?? stats?.lastScorePercent ?? null;
  const latestScoreOutOfTen =
    latestScorePercent !== null && Number.isFinite(latestScorePercent) ? Math.round((latestScorePercent / 100) * 10) : null;
  const latestDurationMinutes = latestSessionWithDuration?.durationMinutes ?? null;
  const latestDurationLabel = formatDurationLabel(latestDurationMinutes);
  const accessTier = data?.tier ?? null;
  const showUczenPlusBox = accessTier === "premium" || accessTier === "premium_plus";
  const hasPremiumAccess = showUczenPlusBox;
  const isPremiumStatusLoading = isLoading && !data;
  const showSkeleton = isLoading && !onboardingVisible;
  const showAvailablePlanPromo = !showUczenPlusBox && (accessTier === "registered" || accessTier === "unregistered");
  const hasAiSummaryAccess = hasPremiumAccess;
  const sessionHistoryItems = useMemo(() => recentSessions.slice(0, SESSION_HISTORY_LIMIT), [recentSessions]);

  useEffect(() => {
    setAiSummaryExpandedMobile(false);
  }, [aiSummary]);

  const loadAiSummary = useCallback(async (forceRefresh = false) => {
    if (!hasAiSummaryAccess) {
      setAiSummary(null);
      setAiSummaryError(null);
      setAiSummaryRefreshLockedUntil(null);
      setAiSummaryNotice(null);
      setAiSummaryLoading(false);
      return;
    }

    setAiSummaryLoading(true);
    setAiSummaryError(null);
    setAiSummaryNotice(null);

    try {
      const url = forceRefresh ? "/api/e8/dashboard/ai-summary?refresh=1" : "/api/e8/dashboard/ai-summary";
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = (await response.json().catch(() => ({}))) as AiSummaryResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Nie udalo sie pobrac podsumowania AI.");
      }

      setAiSummary(payload.summary ?? null);
      setAiSummaryRefreshLockedUntil(payload.refreshLockedUntil ?? null);
      setAiSummaryNotice(payload.notice ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nie udalo sie pobrac podsumowania AI.";
      setAiSummaryError(message);
      setAiSummary(null);
      setAiSummaryRefreshLockedUntil(null);
      setAiSummaryNotice(null);
    } finally {
      setAiSummaryLoading(false);
    }
  }, [accessToken, hasAiSummaryAccess]);

  useEffect(() => {
    if (!data || !hasAiSummaryAccess) {
      setAiSummary(null);
      setAiSummaryError(null);
      setAiSummaryRefreshLockedUntil(null);
      setAiSummaryNotice(null);
      setAiSummaryLoading(false);
      return;
    }

    void loadAiSummary(false);
  }, [data, hasAiSummaryAccess, loadAiSummary]);

  const heroIntro = useMemo(() => resolveHeroIntroCopy(stats?.sessionsCompleted), [stats?.sessionsCompleted]);
  const strongestModeLabel = stats?.strongestMode ? formatMode(stats.strongestMode) : "Po sesji";
  const weakestModeLabel = stats?.weakestMode ? formatMode(stats.weakestMode) : "Po sesji";
  const hasStrongestMode = Boolean(stats?.strongestMode);
  const hasWeakestMode = Boolean(stats?.weakestMode);
  const tutorialActive = onboardingVisible;
  const tutorialStateIndex = 0;
  const displayHeroIntro = tutorialActive ? TUTORIAL_HERO_STATES[tutorialStateIndex] : heroIntro;
  const heroProgressSubline = useMemo(() => {
    const completedSets = Math.max(0, stats?.sessionsCompleted ?? 0);

    if (completedSets === 0) {
      return "Zacznij od pierwszego zestawu i zbuduj baze.";
    }

    if (completedSets <= 3) {
      return "Lapiesz rytm. Kazdy kolejny zestaw podbija Twoj progres.";
    }

    if (completedSets >= 5) {
      return "Budujesz regularny progres.";
    }

    return "Jestes o krok od regularnego progresu.";
  }, [stats?.sessionsCompleted]);
  const displayLatestResult = tutorialActive
    ? TUTORIAL_LATEST_RESULT_STATES[tutorialStateIndex]
    : null;
  const latestResultScoreOutOfTenLabel = displayLatestResult
    ? displayLatestResult.scoreOutOfTen
    : latestScoreOutOfTen !== null
      ? `${latestScoreOutOfTen}/10`
      : "--/10";
  const latestResultPercentLabel = displayLatestResult
    ? displayLatestResult.scorePercent
    : latestScorePercent !== null && Number.isFinite(latestScorePercent)
      ? `${Math.round(latestScorePercent)}%`
      : "--%";
  const latestResultDurationLabel = displayLatestResult
    ? displayLatestResult.duration
    : latestDurationLabel ?? "--";
  const displayProgressInsight = tutorialActive
    ? TUTORIAL_PROGRESS_INSIGHTS[tutorialStateIndex]
    : progressInsight;
  const displayStatTiles = tutorialActive
    ? TUTORIAL_STAT_TILE_STATES[0]
    : statTiles;
  const progressStatsLayout = useMemo<ProgressStatsLayout>(() => {
    const fallbackTile = (label: string, note: string): DashboardStatTile => ({
      label,
      value: "--",
      note,
      isTrendingUp: false,
    });

    const findTile = (matcher: RegExp, fallback: DashboardStatTile) =>
      displayStatTiles.find((item) => matcher.test(item.label.toLowerCase())) ?? fallback;

    return {
      score: findTile(/srednia.*skuteczn/, fallbackTile("Srednia skutecznosc", "aktualny trend")),
      sessions: findTile(/ukonczone.*sesje/, fallbackTile("Ukonczone sesje", "zamkniete treningi")),
      questions: findTile(/rozwiazane.*pytania/, fallbackTile("Rozwiazane pytania", "w zakonczonych sesjach")),
      duration: findTile(/sredni.*czas.*sesji/, fallbackTile("Sredni czas sesji", "tempo pracy")),
    };
  }, [displayStatTiles]);
  const recentSessionScores = useMemo(
    () =>
      recentSessions
        .filter((session) => session.scorePercent !== null && Number.isFinite(session.scorePercent))
        .slice(0, 5)
        .map((session) => Math.max(0, Math.min(100, Number(session.scorePercent))))
        .reverse(),
    [recentSessions],
  );
  const chartGeometry = useMemo(() => {
    if (recentSessionScores.length < 5) {
      return null;
    }

    const width = 320;
    const height = 150;
    const padX = 12;
    const padTop = 10;
    const padBottom = 28;
    const baselineY = height - padBottom;
    const stepX = (width - padX * 2) / (recentSessionScores.length - 1);
    const points = recentSessionScores.map((score, index) => {
      const x = padX + index * stepX;
      const y = baselineY - (score / 100) * (baselineY - padTop);
      return { x, y, score };
    });
    const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
    const lastX = points[points.length - 1]?.x ?? padX;
    const areaPath = `${linePath} L ${lastX.toFixed(1)} ${baselineY.toFixed(1)} L ${padX.toFixed(1)} ${baselineY.toFixed(1)} Z`;

    return {
      width,
      height,
      padX,
      baselineY,
      points,
      linePath,
      areaPath,
    };
  }, [recentSessionScores]);
  const aiSummaryText = aiSummary ?? "Po kilku sesjach pojawi sie tutaj AI podsumowanie Twojego trendu.";
  const aiSummarySentences = useMemo(
    () =>
      aiSummaryText
        .replace(/\s+/g, " ")
        .trim()
        .split(SENTENCE_SPLIT_PATTERN)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length > 0),
    [aiSummaryText],
  );
  const aiSummaryFirstSentence = aiSummarySentences[0] ?? aiSummaryText;
  const aiSummaryRemainingText = aiSummarySentences.slice(1).join(" ");
  const canExpandAiSummary =
    hasAiSummaryAccess && aiSummaryRemainingText.length > 0 && !showSkeleton && !aiSummaryLoading && !aiSummaryError;
  const aiSummaryRefreshText = useMemo(() => {
    const refreshTimestamp = aiSummaryRefreshLockedUntil ? Date.parse(aiSummaryRefreshLockedUntil) : Number.NaN;

    if (Number.isFinite(refreshTimestamp)) {
      const refreshDate = new Intl.DateTimeFormat("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(refreshTimestamp));
      return `Od\u015bwie\u017cy si\u0119: ${refreshDate}.`;
    }

    if (!aiSummaryNotice) {
      return null;
    }

    const fallbackNotice = aiSummaryNotice
      .replace(/^mozesz odswiezyc ponownie:\s*/i, "")
      .replace(/^odswiezy sie:\s*/i, "")
      .trim();

    if (!fallbackNotice) {
      return null;
    }

    return `Od\u015bwie\u017cy si\u0119: ${fallbackNotice}`;
  }, [aiSummaryNotice, aiSummaryRefreshLockedUntil]);
  const displayModeState = tutorialActive
    ? TUTORIAL_MODE_STATES[0]
    : null;
  const displayStrongestModeLabel = displayModeState ? displayModeState.strongest : strongestModeLabel;
  const displayWeakestModeLabel = displayModeState ? displayModeState.weakest : weakestModeLabel;
  const displayHasStrongestMode = displayModeState ? true : hasStrongestMode;
  const displayHasWeakestMode = displayModeState ? true : hasWeakestMode;
  const intelligentSetCompletedSessions = Math.max(0, stats?.sessionsCompleted ?? 0);
  const intelligentSetSessionsProgress = Math.min(INTELLIGENT_SET_UNLOCK_SESSIONS, intelligentSetCompletedSessions);
  const intelligentSetSessionsRemaining = Math.max(0, INTELLIGENT_SET_UNLOCK_SESSIONS - intelligentSetCompletedSessions);
  const intelligentSetProgressPercent = Math.min(
    100,
    Math.round((intelligentSetSessionsProgress / INTELLIGENT_SET_UNLOCK_SESSIONS) * 100),
  );
  const isIntelligentSetUnlocked = intelligentSetSessionsRemaining === 0;
  const intelligentSetTargetLabel = displayHasWeakestMode ? displayWeakestModeLabel : "obszar do poprawy";
  const intelligentSetHref = recommendedSet
    ? `/e8/quiz?mode=${encodeURIComponent(recommendedSet.mode)}&set=${encodeURIComponent(recommendedSet.id)}`
    : startHref;
  const displayActivityText = tutorialActive
    ? TUTORIAL_ACTIVITY_STATES[tutorialStateIndex]
    : "Jeszcze nie masz historii. Po pierwszej sesji pojawi sie tu podsumowanie.";
  const displayPromoText = tutorialActive
    ? (
      showAvailablePlanPromo
        ? TUTORIAL_PROMO_STATES[tutorialStateIndex]
        : TUTORIAL_UCZEN_PLUS_STATES[tutorialStateIndex]
    )
    : (
      showAvailablePlanPromo
        ? "Odblokuj dostep do treningow E8, wynikow i krotkich wyjasnien."
        : "Nowe opcje nauki pojawia sie juz wkrotce."
    );

  const markOnboardingAsCompleted = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        return;
      }

      await supabase.auth.updateUser({
        data: {
          ...(user.user_metadata ?? {}),
          dashboard_onboarding_completed: true,
        },
      });
    } catch {
      // silent fail, onboarding should not block app usage
    }
  };

  const handleOnboardingSkip = () => {
    setOnboardingVisible(false);
    void markOnboardingAsCompleted();
  };

  const handleOnboardingComplete = () => {
    setOnboardingVisible(false);
    void markOnboardingAsCompleted();
  };

  const nextStepActions = useMemo(() => {
    const actions: NextStepAction[] = [];

    if (inProgressSession) {
      actions.push({
        id: `continue-${inProgressSession.id}`
          .toString(),
        title: "Dokoncz rozpoczeta sesje",
        description: `${formatMode(inProgressSession.mode)} - wracasz dokladnie tam, gdzie przerwales`,
        href: sessionHref(inProgressSession),
        cta: "Kontynuuj",
        icon: Play,
      });
    }

    if (recommendedSet) {
      actions.push({
        id: `focus-${recommendedSet.id}`
          .toString(),
        title: "Zacznij od: Reakcje",
        description: "10 pytan - 6-9 min",
        href: `/e8/quiz?mode=${encodeURIComponent(recommendedSet.mode)}&set=${encodeURIComponent(recommendedSet.id)}`
          .toString(),
        cta: "Uruchom",
        icon: Target,
      });
    }

    if (latestCompletedSession) {
      actions.push({
        id: `review-${latestCompletedSession.id}`
          .toString(),
        title: "Przejrzyj ostatni wynik",
        description: `${formatMode(latestCompletedSession.mode)} - ${formatSessionDate(latestCompletedSession)}`
          .toString(),
        href: sessionHref(latestCompletedSession),
        cta: "Przejdz",
        icon: ListChecks,
      });
    }

    const uniqueByHref = new Set<string>();
    return actions.filter((action) => {
      if (uniqueByHref.has(action.href)) {
        return false;
      }

      uniqueByHref.add(action.href);
      return true;
    });
  }, [inProgressSession, recommendedSet, latestCompletedSession]);

  return (
    <main className="viewport-shell bg-[#050510] [background-image:radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px] text-white selection:bg-indigo-500/30">
      <MobileHeader />

      <div className="relative mx-auto w-full max-w-[88rem] px-5 pt-8 pb-12 md:px-6 md:pt-10 lg:px-9 lg:pb-14 xl:px-10 2xl:max-w-[104rem] 2xl:px-12 min-[2200px]:max-w-[124rem] min-[2200px]:px-16">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:items-stretch 2xl:gap-8 min-[2200px]:gap-10">
          <article data-tour="dashboard-welcome" className="dashboard-enter dashboard-card-hover relative overflow-hidden rounded-3xl border border-indigo-200/20 bg-[linear-gradient(145deg,rgba(16,21,42,0.98),rgba(10,14,30,0.95))] p-8 shadow-[0_36px_90px_-58px_rgba(79,70,229,0.8)] md:p-10 xl:min-h-[32rem]" style={{ animationDelay: "20ms" }}>
            <CardAccent preset="hero" className="dashboard-drift" />
            {hasPremiumAccess ? (
              <div
                aria-hidden
                className="dashboard-breathe pointer-events-none absolute -top-8 -right-10 h-44 w-64 rounded-full bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),rgba(16,185,129,0)_72%)]"
              />
            ) : null}

            <div className="relative z-10">
              <div className="flex items-center justify-end gap-3">
                <div className="flex min-h-[1.25rem] items-center">
                  {isPremiumStatusLoading ? (
                    <span
                      aria-hidden
                      className="inline-block h-5 w-5 rounded-full border-2 border-dashed border-emerald-200/70 border-t-transparent animate-spin"
                    />
                  ) : hasPremiumAccess ? (
                    <p className="text-base font-black tracking-[0.2em] text-emerald-200/95 uppercase md:text-lg">
                      {"UCZE\u0143"}
                    </p>
                  ) : null}
                </div>
              </div>

              <h2 className="mt-3 text-[clamp(22px,5vw,36px)] leading-tight text-white" style={{ fontFamily: "var(--font-figtree)", fontWeight: 900 }}>
                {`Hej, ${userDisplayName}!`}
              </h2>
              <p className="mt-2 text-[clamp(13px,2vw,15px)] leading-snug text-indigo-100/88" style={{ fontFamily: "var(--font-figtree)", fontWeight: 600 }}>
                {tutorialActive ? displayHeroIntro.line1 : heroProgressSubline}
              </p>
              <div className="relative mt-6 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={primarySessionHref}
                  onClick={resumeSessionHref ? undefined : handleStartSessionClick}
                  data-tour="dashboard-start-cta"
                  className="dashboard-btn-hover inline-flex h-12 w-full items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-5 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(79,70,229,0.98)] transition-[transform,filter] duration-150 hover:brightness-110 active:scale-[0.99] sm:flex-1"
                >
                  {primarySessionCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div
                data-tour="dashboard-latest-result"
                className={cn(
                  "relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]",
                  showSkeleton && "dashboard-loading-blur",
                )}
              >
                <div aria-hidden className="pointer-events-none absolute inset-0">
                  <span className="absolute left-[6%] top-[10%] rotate-[-14deg] text-lg font-black text-[#00D4FF] opacity-[0.05] blur-[1px]">%</span>
                  <span className="absolute left-[16%] top-[38%] rotate-[11deg] text-2xl font-black text-[#00D4FF] opacity-[0.05]">%</span>
                  <span className="absolute left-[31%] top-[18%] rotate-[-8deg] text-xl font-black text-[#00D4FF] opacity-[0.045] blur-[1px]">%</span>
                  <span className="absolute left-[42%] top-[58%] rotate-[16deg] text-base font-black text-[#00D4FF] opacity-[0.04]">%</span>
                  <span className="absolute left-[56%] top-[12%] rotate-[-10deg] text-2xl font-black text-[#00D4FF] opacity-[0.045] blur-[2px]">%</span>
                  <span className="absolute left-[67%] top-[42%] rotate-[8deg] text-xl font-black text-[#00D4FF] opacity-[0.045]">%</span>
                  <span className="absolute left-[79%] top-[24%] rotate-[-16deg] text-3xl font-black text-[#00D4FF] opacity-[0.055] blur-[1px]">%</span>
                  <span className="absolute left-[88%] top-[62%] rotate-[9deg] text-lg font-black text-[#00D4FF] opacity-[0.04] blur-[1px]">%</span>
                </div>
                <div className="relative z-10 grid grid-cols-2">
                  <div className="p-3">
                    <p className="text-[11px] font-semibold tracking-[0.1em] text-indigo-200/75 uppercase">Ostatni wynik</p>
                    <div className="mt-2.5 grid grid-cols-[auto_1fr] items-center gap-4">
                      {showSkeleton ? (
                        <>
                          <div className="space-y-2.5">
                            <div>
                              <SkeletonWave className="h-7 w-14 rounded-lg" />
                              <SkeletonWave className="mt-1 h-3 w-12 rounded" />
                            </div>
                            <div>
                              <SkeletonWave className="h-7 w-14 rounded-lg" />
                              <SkeletonWave className="mt-1 h-3 w-12 rounded" />
                            </div>
                          </div>
                          <div className="flex justify-center">
                            <div>
                              <SkeletonWave className="h-9 w-16 rounded-lg" />
                              <SkeletonWave className="mt-1 h-3 w-10 rounded" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-2.5">
                            <div>
                              <p className="text-[clamp(20px,4vw,28px)] font-black leading-none text-white">{latestResultScoreOutOfTenLabel}</p>
                              <p className="mt-1 text-xs font-semibold tracking-[0.08em] text-indigo-200/62 uppercase">{"pyta\u0144"}</p>
                            </div>
                            <div>
                              <p className="text-[clamp(20px,4vw,28px)] font-black leading-none text-white">{latestResultDurationLabel}</p>
                              <p className="mt-1 text-xs font-semibold tracking-[0.08em] text-indigo-200/62 uppercase">czas</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-[clamp(20px,4vw,28px)] font-black leading-none text-white">{latestResultPercentLabel}</p>
                            <p className="mt-1 text-xs font-semibold tracking-[0.08em] text-indigo-200/62 uppercase">wynik</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div aria-hidden className="relative">
                    <span className="pointer-events-none absolute inset-y-0 right-[-1.2rem] flex items-center justify-end whitespace-pre text-right text-[3.35rem] font-black leading-[0.72] tracking-[-0.055em] text-white opacity-[0.08] blur-[2px] select-none">
                      {"SAME\nSI\u0118 NIE\nWBIJA"}
                    </span>
                  </div>
                </div>

                <div className="relative z-10 border-t border-white/10 px-3 py-3">
                  {showSkeleton ? (
                    <div className="flex justify-end">
                      <SkeletonWave className="h-5 w-24 rounded" />
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsSessionHistoryOpen((current) => !current)}
                          aria-expanded={isSessionHistoryOpen}
                          className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-semibold tracking-[0.04em] text-indigo-100/66 transition-colors duration-150 hover:text-indigo-100/90"
                        >
                          <span>{"Historia sesji"}</span>
                          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isSessionHistoryOpen && "rotate-180")} />
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                        {isSessionHistoryOpen ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3">
                              {sessionHistoryItems.length === 0 ? (
                                <p className="text-xs text-indigo-100/74">{displayActivityText}</p>
                              ) : (
                                <ul className="space-y-2">
                                  {sessionHistoryItems.map((session) => {
                                    const scorePercentValue =
                                      session.scorePercent !== null && Number.isFinite(session.scorePercent)
                                        ? `${Math.round(session.scorePercent)}%`
                                        : null;
                                    const durationValue = formatDurationLabel(session.durationMinutes);
                                    const questionCountValue =
                                      session.totalQuestions !== null && session.totalQuestions > 0
                                        ? `${session.totalQuestions} pytan`
                                        : null;
                                    const summary = [scorePercentValue, durationValue, questionCountValue].filter(Boolean).join(" - ");

                                    return (
                                      <li key={session.id} className="flex items-start justify-between gap-3 border-b border-white/8 pb-2 text-sm last:border-b-0 last:pb-0">
                                        <span className="text-indigo-100/84">
                                          {formatSessionDate(session)}
                                        </span>
                                        <span className="shrink-0 text-indigo-100/62">
                                          {summary || (session.status === "in_progress" ? "W toku" : "Zakonczona")}
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              </div>

              <section className={cn("mt-5 border-t border-white/10 pt-4", showSkeleton && "dashboard-loading-blur")}>
                <div className="flex items-start gap-3">
                  <div className="inline-flex items-center gap-2">
                    <SectionIcon icon={Sparkles} tone="violet" />
                    <div>
                      <div className="inline-flex items-center gap-1.5">
                        <p className="text-[11px] font-semibold tracking-[0.1em] text-indigo-200/75 uppercase">AI podsumowanie</p>
                        <span className="inline-flex items-center rounded-full border border-teal-200/40 bg-teal-300/16 px-2 py-[3px] text-[11px] font-semibold tracking-[0.08em] text-teal-100 shadow-[0_0_18px_-6px_rgba(45,212,191,0.85),0_0_26px_-14px_rgba(168,85,247,0.65)]">
                          AI
                        </span>
                      </div>
                      <p className="text-xs text-indigo-100/62">5 ostatnich sesji</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-[linear-gradient(135deg,rgba(45,212,191,0.34),rgba(56,189,248,0.22),rgba(168,85,247,0.34))] p-[1.5px]">
                  <div className="rounded-[15px] bg-[linear-gradient(160deg,rgba(10,16,34,0.93),rgba(7,11,24,0.95))] p-5 shadow-[0_18px_30px_-24px_rgba(45,212,191,0.45)]">
                    {showSkeleton ? (
                      <div className="space-y-2">
                        <SkeletonWave className="h-5 w-[86%] rounded" />
                        <SkeletonWave className="h-4 w-full rounded" />
                      </div>
                    ) : !hasAiSummaryAccess ? (
                      <div>
                        <p className="text-[clamp(13px,2vw,15px)] leading-relaxed text-emerald-100/82">Ta funkcja jest dostepna w planie Uczen i Uczen+.</p>
                        <button
                          type="button"
                          onClick={() => setPlansModalOpen(true)}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-100/86 transition-colors duration-150 hover:text-emerald-50"
                        >
                          Odblokuj plan
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    ) : aiSummaryLoading ? (
                      <div className="space-y-2">
                        <SkeletonWave className="h-5 w-[82%] rounded" />
                        <SkeletonWave className="h-4 w-full rounded" />
                      </div>
                    ) : aiSummaryError ? (
                      <p className="text-[clamp(13px,2vw,15px)] text-red-100/85">{aiSummaryError}</p>
                    ) : (
                      <div>
                        <p className="text-[clamp(14px,2.5vw,17px)] leading-relaxed font-semibold text-white">{aiSummaryFirstSentence}</p>
                        <AnimatePresence initial={false}>
                          {aiSummaryExpandedMobile && aiSummaryRemainingText ? (
                            <motion.p
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: "easeOut" }}
                              className="mt-1 overflow-hidden text-[clamp(13px,2vw,15px)] leading-relaxed text-white/50"
                            >
                              <span className="block pt-0.5">{aiSummaryRemainingText}</span>
                            </motion.p>
                          ) : null}
                        </AnimatePresence>
                        {canExpandAiSummary ? (
                          <button
                            type="button"
                            onClick={() => setAiSummaryExpandedMobile((current) => !current)}
                            className="mt-2 inline-flex items-center text-xs font-semibold text-teal-200/90 transition-colors duration-150 hover:text-teal-100"
                          >
                            {aiSummaryExpandedMobile ? "Pokaz mniej" : "Czytaj wi\u0119cej"}
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                {hasAiSummaryAccess && aiSummaryRefreshText && !showSkeleton ? (
                  <p className="mt-2 text-[11px] text-indigo-200/60">{aiSummaryRefreshText}</p>
                ) : null}
              </section>
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute right-5 bottom-6 z-20 hidden md:block select-none bg-[linear-gradient(180deg,rgba(190,205,238,0.22)_0%,rgba(145,161,205,0.14)_44%,rgba(86,99,141,0.06)_100%)] bg-clip-text text-[0.57rem] tracking-[0.04em] text-transparent opacity-32 [text-shadow:0_1px_0_rgba(255,255,255,0.18),0_-1px_0_rgba(0,0,0,0.66)] md:text-[0.8rem]" style={{ fontFamily: "var(--font-figtree)", fontWeight: 900 }}
            >
              nAIczyciel
            </div>
          </article>
          <div className="grid gap-5">
            <article
              data-tour="dashboard-progress"
              className={cn(
                "dashboard-enter dashboard-card-hover relative overflow-hidden rounded-3xl border border-white/12 bg-[linear-gradient(160deg,rgba(12,17,34,0.96),rgba(8,11,25,0.95))] p-7 md:p-8 xl:min-h-[21rem]",
                showSkeleton && "dashboard-loading-blur",
              )}
              style={{ animationDelay: "150ms" }}
            >
              <CardAccent preset="progress" className="dashboard-drift" />
              <div
                aria-hidden
                className="pointer-events-none absolute -top-8 -right-10 h-44 w-64 rounded-full bg-[radial-gradient(circle_at_top_right,rgba(226,232,240,0.16),rgba(226,232,240,0)_72%)]"
              />

              <div className="relative z-10">
                <div className="flex items-center justify-end gap-3">
                  <h2 className="text-base font-black tracking-[0.2em] text-indigo-100 uppercase md:text-lg">{"Postep"}</h2>
                </div>

                <h2
                  className="mt-2 text-[clamp(22px,5vw,36px)] leading-tight text-white"
                  style={{ fontFamily: "var(--font-figtree)", fontWeight: 900 }}
                >
                  {displayProgressInsight}
                </h2>

                {showSkeleton ? (
                  <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(34,197,94,0.18)_100%)] p-4">
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#22c55e]/24 via-[#22c55e]/11 to-transparent" />
                    <div className="relative z-10 grid grid-cols-2 gap-x-6 gap-y-5">
                      {[0, 1, 2, 3].map((idx) => (
                        <div
                          key={`progress-skeleton-${idx}`}
                          className="space-y-2"
                        >
                          <SkeletonWave className="h-3 w-28 rounded" />
                          <SkeletonWave className="mt-2 h-8 w-20 rounded-lg" />
                          <SkeletonWave className="mt-2 h-3 w-24 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : loadError ? (
                  <p className="mt-4 text-[clamp(13px,2vw,15px)] text-red-100/80">{"Nie moge teraz odczytac statystyk. Sprobuj ponownie po chwili."}</p>
                ) : displayStatTiles.length === 0 && !chartGeometry ? (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(34,197,94,0.16)_100%)] px-4 py-3.5">
                    <p className="text-[clamp(13px,2vw,15px)] text-indigo-100/78">Po pierwszej sesji pojawia sie tu statystyki.</p>
                    <Link
                      href={primarySessionHref}
                      onClick={resumeSessionHref ? undefined : handleStartSessionClick}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-100/88 transition-colors hover:text-white"
                    >
                      {primaryStatsCtaLabel}
                    </Link>
                  </div>
                ) : (
                  <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(34,197,94,0.18)_100%)] p-4">
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#22c55e]/24 via-[#22c55e]/11 to-transparent" />

                    {chartGeometry ? (
                      <div
                        className={cn(
                          "pointer-events-none absolute inset-3 transition-[opacity,filter] duration-250",
                          progressViewTab === "stats" ? "opacity-[0.15] blur-[1px]" : "opacity-100 blur-0",
                        )}
                      >
                        <svg viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`} className="h-full w-full" role="img" aria-label="Wykres skutecznosci z ostatnich 5 sesji">
                          <defs>
                            <linearGradient id="progress-chart-area" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(45,212,191,0.22)" />
                              <stop offset="100%" stopColor="rgba(45,212,191,0.03)" />
                            </linearGradient>
                          </defs>
                          <line
                            x1={chartGeometry.padX}
                            y1={chartGeometry.baselineY}
                            x2={chartGeometry.width - chartGeometry.padX}
                            y2={chartGeometry.baselineY}
                            stroke="rgba(255,255,255,0.14)"
                            strokeWidth="1"
                          />
                          <path d={chartGeometry.areaPath} fill="url(#progress-chart-area)" />
                          <path d={chartGeometry.linePath} fill="none" stroke="#2dd4bf" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                          {chartGeometry.points.map((point) => (
                            <g key={`chart-point-${point.x}-${point.y}`}>
                              <circle cx={point.x} cy={point.y} r="2.8" fill="#6ff2dc" stroke="rgba(3,7,18,0.9)" strokeWidth="1" />
                              <text
                                x={point.x}
                                y={chartGeometry.height - 6}
                                textAnchor="middle"
                                fontSize="10"
                                fill="rgba(203,213,225,0.68)"
                              >
                                {`${Math.round(point.score)}%`}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    ) : null}

                    <div
                      className={cn(
                        "relative z-10 transition-opacity duration-250",
                        progressViewTab === "stats" ? "opacity-100" : "pointer-events-none opacity-0",
                      )}
                    >
                      <div className="grid grid-cols-[0.78fr_0.92fr_0.72fr] items-stretch gap-3">
                        <div className="flex h-full flex-col justify-center gap-0.5">
                          <div className="py-0.5">
                            <p className="inline-flex items-center text-[clamp(20px,4vw,28px)] font-bold leading-none text-white">
                              {progressStatsLayout.questions.value}
                              {progressStatsLayout.questions.isTrendingUp ? (
                                <span className="ml-1.5 text-base font-semibold text-[#22c55e]">{"\u2191"}</span>
                              ) : null}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold tracking-[0.1em] text-indigo-200/70 uppercase">{"Pytania"}</p>
                          </div>
                          <div className="py-0.5">
                            <p className="inline-flex items-center text-[clamp(20px,4vw,28px)] font-bold leading-none text-white">
                              {progressStatsLayout.sessions.value}
                              {progressStatsLayout.sessions.isTrendingUp ? (
                                <span className="ml-1.5 text-base font-semibold text-[#22c55e]">{"\u2191"}</span>
                              ) : null}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold tracking-[0.1em] text-indigo-200/70 uppercase">{"Sesje"}</p>
                          </div>
                        </div>

                        <div className="flex h-full -ml-2 flex-col justify-center gap-4 pt-2">
                          <div className="min-h-[4.4rem]">
                            <p className="inline-flex items-center text-[clamp(20px,4vw,28px)] font-bold leading-none text-white">
                              {progressStatsLayout.score.value}
                              {progressStatsLayout.score.isTrendingUp ? (
                                <span className="ml-1.5 text-base font-semibold text-[#22c55e]">{"\u2191"}</span>
                              ) : null}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold tracking-[0.1em] text-indigo-200/70 uppercase">{"Skuteczno\u015b\u0107"}</p>
                          </div>
                          <div className="min-h-[4.4rem]">
                            <p className="inline-flex items-center text-[clamp(20px,4vw,28px)] font-bold leading-none text-white">
                              {progressStatsLayout.duration.value}
                              {progressStatsLayout.duration.isTrendingUp ? (
                                <span className="ml-1.5 text-base font-semibold text-[#22c55e]">{"\u2191"}</span>
                              ) : null}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold tracking-[0.1em] text-indigo-200/70 uppercase">{"Czas"}</p>
                          </div>
                        </div>

                        <div aria-hidden className="relative min-h-[9.4rem] overflow-hidden">
                          {STATS_DECORATIVE_ARROWS.map((arrow, index) => (
                            <span
                              key={`stats-trend-arrow-${index}`}
                              className="absolute -translate-x-1/2 -translate-y-1/2 font-semibold text-[#22c55e]"
                              style={{
                                top: `${arrow.top}%`,
                                left: `${arrow.left}%`,
                                opacity: arrow.opacity,
                                fontSize: `${arrow.size}px`,
                                filter: `blur(${(arrow.blur ?? 0) + 0.8}px)`,
                              }}
                            >
                              {"\u2191"}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {progressViewTab === "chart" && !chartGeometry ? (
                      <p className="relative z-10 text-[clamp(13px,2vw,15px)] text-indigo-100/78">Za malo zakonczonych sesji, aby pokazac wykres.</p>
                    ) : null}
                  </div>
                )}

                <div className="mt-3 flex justify-center">
                  <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1">
                    <button
                      type="button"
                      onClick={() => setProgressViewTab("stats")}
                      aria-label="Statystyki"
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150",
                        progressViewTab === "stats"
                          ? "bg-[#2dd4bf]/16 text-[#9ff7e4] shadow-[inset_0_-1px_0_rgba(45,212,191,0.6)]"
                          : "text-slate-300/65 hover:text-slate-200/85",
                      )}
                    >
                      <ListChecks className="h-4 w-4" />
                      <span className="sr-only">Statystyki</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProgressViewTab("chart")}
                      aria-label="Wykres"
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150",
                        progressViewTab === "chart"
                          ? "bg-[#2dd4bf]/16 text-[#9ff7e4] shadow-[inset_0_-1px_0_rgba(45,212,191,0.6)]"
                          : "text-slate-300/65 hover:text-slate-200/85",
                      )}
                    >
                      <ChartNoAxesColumn className="h-4 w-4" />
                      <span className="sr-only">Wykres</span>
                    </button>
                  </div>
                </div>

                <div className="relative mt-6">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-[0.86rem] top-[1.9rem] h-[1.35rem] w-px bg-gradient-to-b from-emerald-200/34 via-white/10 to-amber-200/34"
                  />
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200/18 bg-emerald-300/[0.08] text-emerald-100/72">
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p
                          className={cn(
                            "text-[11px] font-semibold tracking-[0.1em] uppercase",
                            displayHasStrongestMode ? "text-emerald-100/72" : "text-emerald-100/52",
                          )}
                        >
                          Mocna strona
                        </p>
                        <p className={cn("mt-1 text-lg font-semibold", displayHasStrongestMode ? "text-emerald-50/90" : "text-white/80")}>{showSkeleton ? <SkeletonWave className="h-7 w-24 rounded-lg" />  : displayStrongestModeLabel}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-amber-200/18 bg-amber-300/[0.08] text-amber-100/72">
                        <Dumbbell className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p
                          className={cn(
                            "text-[11px] font-semibold tracking-[0.1em] uppercase",
                            displayHasWeakestMode ? "text-amber-100/72" : "text-amber-100/52",
                          )}
                        >
                          Do poprawy
                        </p>
                        <p className={cn("mt-1 text-lg font-semibold", displayHasWeakestMode ? "text-amber-50/90" : "text-white/80")}>{showSkeleton ? <SkeletonWave className="h-7 w-24 rounded-lg" />  : displayWeakestModeLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <section className={cn("mt-5 border-t border-white/10 pt-4", showSkeleton && "dashboard-loading-blur")}>
                  <div className="inline-flex items-center gap-2">
                    <SectionIcon icon={ListChecks} tone="emerald" />
                    <h3 className="text-sm font-semibold tracking-[0.08em] text-indigo-100 uppercase">{"Inteligentny zestaw"}</h3>
                  </div>

                  {showSkeleton ? (
                    <div className="mt-3 space-y-2">
                      <SkeletonWave className="h-4 w-56 rounded" />
                      <SkeletonWave className="h-4 w-44 rounded" />
                      <SkeletonWave className="h-4 w-24 rounded" />
                    </div>
                  ) : !isIntelligentSetUnlocked ? (
                    <div className="mt-3">
                      <p className="text-[clamp(13px,2vw,15px)] text-indigo-100/86">
                        {`Zr\u00f3b jeszcze ${intelligentSetSessionsRemaining} sesji \u017ceby odblokowa\u0107 sw\u00f3j inteligentny zestaw.`}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <span
                            aria-hidden
                            className="block h-full rounded-full bg-gradient-to-r from-emerald-400/75 via-emerald-300/75 to-cyan-300/75"
                            style={{ width: `${intelligentSetProgressPercent}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs font-semibold tracking-[0.06em] text-indigo-100/70">
                          {`${intelligentSetSessionsProgress}/${INTELLIGENT_SET_UNLOCK_SESSIONS}`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-[clamp(13px,2vw,15px)] text-indigo-100/86">
                        {`Masz ${INTELLIGENT_SET_QUESTION_COUNT} pyta\u0144 celowanych w ${intelligentSetTargetLabel}. Gotowy?`}
                      </p>
                      <Link
                        href={intelligentSetHref}
                        onClick={handleStartSessionClick}
                        className="dashboard-btn-hover mt-3 inline-flex h-11 w-full items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-5 text-sm font-semibold text-white shadow-[0_14px_26px_-16px_rgba(16,185,129,0.9)] transition-[transform,filter] duration-150 hover:brightness-110 active:scale-[0.99]"
                      >
                        {"Zacznij zestaw"}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </section>
              </div>
            </article>
          </div>
        </section>
        <section className="mt-3">
          <article
            className={cn(
              "dashboard-enter dashboard-card-hover relative overflow-hidden rounded-3xl border p-5 md:p-6",
              isPremiumStatusLoading && "dashboard-loading-blur",
              showAvailablePlanPromo
                ? "border-emerald-300/36 bg-[linear-gradient(152deg,rgba(9,26,25,0.96),rgba(7,20,21,0.95))] shadow-[0_24px_44px_-28px_rgba(16,185,129,0.65)]"
                : "border-slate-100/24 bg-[linear-gradient(152deg,rgba(18,22,36,0.97),rgba(10,14,26,0.95))] shadow-[0_18px_34px_-26px_rgba(226,232,240,0.5)]",
            )}
            style={{ animationDelay: "260ms" }}
          >
            <div
              aria-hidden
              className={cn(
                "dashboard-breathe pointer-events-none absolute -top-8 -right-10 h-28 w-40 rounded-full",
                showAvailablePlanPromo
                  ? "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.26),rgba(16,185,129,0)_72%)]"
                  : "bg-[radial-gradient(circle_at_top_right,rgba(226,232,240,0.2),rgba(226,232,240,0)_72%)]",
              )}
            />
            {showAvailablePlanPromo ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-10 -bottom-8 h-20 rounded-full bg-emerald-400/18 blur-2xl"
              />
            ) : null}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-0 h-[78%] w-[50%] opacity-58 blur-[0.8px] [mask-image:linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.72)_64%,transparent_100%)]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(4,7,16,0.86) 0%, rgba(10,14,26,0.62) 24%, transparent 74%), radial-gradient(circle, rgba(255,255,255,0.16) 1.1px, transparent 1.9px)",
                backgroundSize: "100% 100%, 10px 10px",
                backgroundPosition: "0 0, 0 100%",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 right-0 h-[78%] w-[50%] opacity-58 blur-[0.8px] [mask-image:linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.72)_64%,transparent_100%)]"
              style={{
                backgroundImage:
                  "linear-gradient(to left, rgba(4,7,16,0.86) 0%, rgba(10,14,26,0.62) 24%, transparent 74%), radial-gradient(circle, rgba(255,255,255,0.16) 1.1px, transparent 1.9px)",
                backgroundSize: "100% 100%, 10px 10px",
                backgroundPosition: "0 0, 0 100%",
              }}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
                    showAvailablePlanPromo
                      ? "border border-emerald-300/35 bg-emerald-400/16 text-emerald-100"
                      : "border border-cyan-300/28 bg-cyan-400/10 text-cyan-100",
                  )}
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                </span>
                <h2 className={cn("text-xs font-semibold tracking-[0.08em] uppercase", showAvailablePlanPromo ? "text-emerald-50" : "text-slate-100")}>
                  {showAvailablePlanPromo ? "UCZEN" : "Uczen+ wkrotce"}
                </h2>
              </div>
              {showAvailablePlanPromo ? (
                <button
                  type="button"
                  onClick={() => setPlansModalOpen(true)}
                  className="dashboard-btn-hover inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-emerald-200/38 bg-[linear-gradient(180deg,rgba(16,185,129,0.3),rgba(5,150,105,0.2))] px-2.5 text-[11px] font-semibold text-emerald-50 transition-[border-color,filter] duration-150 hover:border-emerald-100/55 hover:brightness-110"
                >
                  Zobacz plany
                  <ChevronRight className="h-3 w-3" />
                </button>
              ) : (
                <Link
                  href="/konto"
                  className="dashboard-btn-hover inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-100/30 bg-[linear-gradient(180deg,rgba(226,232,240,0.14),rgba(203,213,225,0.08))] px-2.5 text-[11px] font-semibold text-slate-50 transition-[border-color,filter] duration-150 hover:border-slate-100/40 hover:brightness-110"
                >
                  Powiadom
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            <p className={cn("mt-1.5 text-xs leading-relaxed", showAvailablePlanPromo ? "text-emerald-100/90" : "text-slate-100/80")}>
              {displayPromoText}
            </p>
          </article>
        </section>
<div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent via-[#050510]/50 to-[#050510]"
        />
      </div>

      <footer className="mx-auto w-full max-w-[88rem] px-5 pb-8 md:px-6 lg:px-9 xl:px-10 2xl:max-w-[104rem] 2xl:px-12 min-[2200px]:max-w-[124rem] min-[2200px]:px-16">
        <div className="flex items-center justify-center border-t border-white/8 pt-4">
          <SocialLinks />
        </div>
      </footer>

      <AnimatePresence>
        {plansModalOpen ? (
          <div className="fixed inset-0 z-[95] flex items-center justify-center px-4 py-8">
            <motion.button
              type="button"
              aria-label="Zamknij popup planow"
              className="absolute inset-0 bg-[#030611]/78 backdrop-blur-sm"
              onClick={() => setPlansModalOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: modalMotion.backdropDuration, ease: PREMIUM_MODAL_EASE }}
            />

            <motion.div
              className="relative z-10 w-full max-w-6xl rounded-3xl border border-emerald-200/24 bg-[linear-gradient(165deg,rgba(8,12,25,0.96),rgba(5,9,20,0.98))] p-5 shadow-[0_38px_90px_-54px_rgba(16,185,129,0.58)] md:p-6"
              initial={prefersReducedMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: modalMotion.modalDuration, ease: PREMIUM_MODAL_EASE }}
              role="dialog"
              aria-modal="true"
              aria-label="Wybierz plan"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-white md:text-3xl">Wszystko, czego potrzebujesz</h3>
                  <p className="mt-1 text-sm text-indigo-100/78">Ten sam dostep, rozny czas korzystania. Wybierz opcje, ktora najbardziej Ci pasuje.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPlansModalOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/16 bg-white/[0.05] text-sm font-semibold text-white/90 transition-[border-color,background-color] duration-150 hover:border-white/28 hover:bg-white/[0.08]"
                >
                  X
                </button>
              </div>

              <motion.div
                className="mt-5 grid gap-3 md:grid-cols-3"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: modalMotion.cardStagger,
                      delayChildren: prefersReducedMotion ? 0 : 0.04,
                    },
                  },
                }}
              >
                {DASHBOARD_PLAN_OFFERS.map((plan) => (
                  <motion.article
                    key={plan.id}
                    variants={{
                      hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: modalMotion.cardDuration, ease: PREMIUM_MODAL_EASE },
                      },
                    }}
                    whileHover={modalMotion.cardHover}
                    className={cn(
                      "rounded-2xl border p-4 transition-[transform,border-color,box-shadow] duration-200 md:p-5",
                      plan.featured
                        ? "border-indigo-300/35 bg-gradient-to-br from-indigo-500/20 via-indigo-500/10 to-slate-900/60 shadow-[0_12px_28px_-16px_rgba(99,102,241,0.7)] hover:border-indigo-200/45 hover:shadow-[0_20px_34px_-20px_rgba(99,102,241,0.78)]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/18 hover:shadow-[0_16px_30px_-24px_rgba(148,163,184,0.45)]"
                    )}
                  >
                    <div className="min-h-[4.5rem]">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-300">{plan.name}</p>
                      <p className="mt-1 text-4xl font-black tracking-tight text-white">{plan.price}</p>
                    </div>
                    <p className="mt-2 min-h-[3rem] text-sm leading-relaxed text-gray-300">{plan.description}</p>
                    <p className="mt-5 text-[11px] text-gray-400">Pelny dostep do cwiczen, wyjasnien i analizy.</p>
                    <motion.button
                      type="button"
                      onClick={() => {
                        setPlansModalOpen(false);
                        window.location.href = "/e8?plans=1#pricing";
                      }}
                      whileHover={modalMotion.buttonHover}
                      whileTap={{ scale: 0.96 }}
                      className={cn(
                        "mt-4 w-full rounded-xl border py-2.5 text-sm font-semibold transition-[transform,filter,background-color,border-color] duration-150 ease-out active:scale-[0.96]",
                        plan.featured
                          ? "border-indigo-300/40 bg-indigo-500 text-white hover:bg-indigo-400"
                          : "border-white/18 bg-white/[0.08] text-white/95 hover:border-white/28 hover:bg-white/[0.12]"
                      )}
                    >
                      Wybierz
                    </motion.button>
                  </motion.article>
                ))}
              </motion.div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      {onboardingVisible ? (
        <DashboardOnboarding
          steps={DASHBOARD_ONBOARDING_STEPS}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      ) : null}

      <style jsx global>{`
        @keyframes dashboardEnter {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes dashboardDrift {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 1;
          }
          50% {
            transform: translate3d(0, -4px, 0);
            opacity: 0.9;
          }
        }

        @keyframes dashboardBreathe {
          0%,
          100% {
            opacity: 0.85;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.03);
          }
        }

        @keyframes dashboardWave {
          0% {
            background-position: 180% 0;
          }
          100% {
            background-position: -180% 0;
          }
        }

        .dashboard-wave {
          animation: dashboardWave 1.8s ease-in-out infinite;
          will-change: background-position;
        }

        .dashboard-loading-blur {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          background-color: rgba(99, 102, 241, 0.06);
        }

        .dashboard-loading-blur > * {
          opacity: 0 !important;
          user-select: none;
          pointer-events: none;
        }

        .dashboard-loading-blur::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: linear-gradient(112deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.04));
          background-size: 220% 100%;
          animation: dashboardWave 2.4s ease-in-out infinite;
          pointer-events: none;
        }

        .dashboard-enter {
          animation-name: dashboardEnter;
          animation-duration: 0.52s;
          animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
          animation-fill-mode: both;
          will-change: transform, opacity;
        }

        .dashboard-drift {
          animation: dashboardDrift 6.5s ease-in-out infinite;
          transform-origin: center;
          will-change: transform, opacity;
        }

        .dashboard-breathe {
          animation: dashboardBreathe 5.5s ease-in-out infinite;
          transform-origin: top right;
          will-change: transform, opacity;
        }

        @media (hover: hover) and (pointer: fine) {
          .dashboard-card-hover {
            transition:
              transform 0.22s ease,
              border-color 0.22s ease,
              box-shadow 0.22s ease,
              background-color 0.22s ease,
              filter 0.22s ease;
          }

          .dashboard-card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 36px -28px rgba(99, 102, 241, 0.52);
            border-color: rgba(165, 180, 252, 0.26);
          }

          .dashboard-btn-hover {
            transition:
              transform 0.2s ease,
              filter 0.2s ease,
              box-shadow 0.2s ease;
          }

          .dashboard-btn-hover:hover {
            transform: translateY(-1px);
            filter: brightness(1.05);
            box-shadow: 0 14px 28px -18px rgba(79, 70, 229, 0.75);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-enter,
          .dashboard-drift,
          .dashboard-breathe,
          .dashboard-wave {
            animation: none !important;
          }

          .dashboard-loading-blur::after {
            animation: none !important;
          }

          .dashboard-card-hover,
          .dashboard-btn-hover {
            transition: none !important;
          }

          .dashboard-card-hover:hover,
          .dashboard-btn-hover:hover {
            transform: none !important;
            box-shadow: none !important;
            filter: none !important;
          }
        }
      `}</style>
    </main>
  );
}






























