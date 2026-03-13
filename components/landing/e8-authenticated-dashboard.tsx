
"use client";

import {
  ArrowRight,
  ChartNoAxesColumn,
  ChevronDown,
  GraduationCap,
  ChevronRight,
  Clock3,
  ListChecks,
  Play,
  Sparkles,
  Settings,
  Target,
  type LucideIcon,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardOnboarding, {
  type DashboardOnboardingStep,
} from "@/components/landing/dashboard-onboarding";
import MobileHeader from "@/components/landing/mobile-header";
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
    price: "5 z\u0142",
    description: "Na szybki start i kr\u00F3tkie powt\u00F3rki.",
  },
  {
    id: "plan-7-days",
    name: "7 DNI",
    price: "11 z\u0142",
    description: "Na intensywny tydzie\u0144 nauki przed sprawdzianem lub egzaminem.",
  },
  {
    id: "plan-30-days",
    name: "30 DNI",
    price: "24 z\u0142",
    description: "Najlepsza opcja do regularnej nauki i spokojnego przerabiania materia\u0142u.",
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
  vocabulary: "S\u0142ownictwo",
  grammar: "Gramatyka",
};

const DASHBOARD_ONBOARDING_STEPS: DashboardOnboardingStep[] = [
  {
    id: "welcome",
    target: "[data-tour=\"dashboard-welcome\"]",
    title: "Witaj w panelu",
    text: "Tutaj zaczynasz kr\u00f3tkie treningi i \u015bledzisz post\u0119py.",
  },
  {
    id: "cta",
    target: "[data-tour=\"dashboard-start-cta\"]",
    title: "Start sesji",
    text: "Kliknij tutaj, aby rozpocz\u0105\u0107 pierwsz\u0105 sesj\u0119.",
  },
  {
    id: "result",
    target: "[data-tour=\"dashboard-latest-result\"]",
    title: "Ostatni wynik",
    text: "Po zako\u0144czeniu sesji zobaczysz tu punkty, procent i czas.",
  },
  {
    id: "progress",
    target: "[data-tour=\"dashboard-progress\"]",
    title: "Post\u0119p",
    text: "Tutaj pojawi\u0105 si\u0119 Twoje mocne strony i obszary do poprawy.",
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
  const normalized = normalizeMode(mode);
  return MODE_LABEL[normalized] ?? (normalized.length > 0 ? normalized : "Reakcje");
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

  return `${value.toFixed(1)} min`;
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

function sessionActionLabel(session: DashboardSession): string {
  return session.status === "completed" ? "Przejrzyj" : "Kontynuuj";
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
};

const ACTIVITY_PREVIEW_LIMIT = 2;
const ACTIVITY_MAX_LIMIT = 30;

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
    { label: "Srednia skutecznosc", value: "62%", note: "aktualny trend" },
    { label: "Ukonczone sesje", value: "1", note: "zamkniete treningi" },
    { label: "Rozwiazane pytania", value: "10", note: "w zakonczonych sesjach" },
    { label: "Sredni czas sesji", value: "8.3 min", note: "tempo pracy" },
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

const TUTORIAL_NEXT_STEP_STATES: string[] = [
  "Po quizie podpowiemy najlepszy kolejny krok.",
  "System dobierze nastepny zestaw pod Twoj wynik.",
  "Dostaniesz prosta rekomendacje kolejnej sesji.",
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

function resolveHeroIntroCopy(completedSessionsRaw: number | null | undefined): HeroIntroCopy {
  const completedSessions =
    typeof completedSessionsRaw === "number" && Number.isFinite(completedSessionsRaw)
      ? Math.max(0, Math.floor(completedSessionsRaw))
      : 0;

  if (completedSessions === 0) {
    return {
      headline: "Witaj",
      line1: "Zacznij od pierwszej sesji.",
      line2: "Po niej zobaczysz, co ju\u017c umiesz i nad czym warto jeszcze popracowa\u0107.",
    };
  }

  if (completedSessions === 1) {
    return {
      headline: "Pierwsza sesja za Tob\u0105",
      line1: "Masz ju\u017c pierwszy wynik i punkt odniesienia do kolejnych trening\u00f3w.",
      line2: "Teraz najwi\u0119cej da regularne \u0107wiczenie kolejnych zestaw\u00f3w.",
    };
  }

  if (completedSessions <= 3) {
    return {
      headline: "\u0141apiesz ju\u017c rytm",
      line1: "Masz za sob\u0105 pierwsze sesje i wida\u0107, co idzie Ci lepiej.",
      line2: "\u0106wicz dalej, \u017ceby utrwali\u0107 mocne strony i poprawi\u0107 s\u0142absze obszary.",
    };
  }

  return {
    headline: "Budujesz regularny progres",
    line1: "Masz ju\u017c kilka sesji za sob\u0105 i coraz wyra\u017aniej wida\u0107 Tw\u00f3j post\u0119p.",
    line2: "Kontynuuj trening, \u017ceby utrzyma\u0107 tempo i poprawia\u0107 wynik krok po kroku.",
  };
}

function buildProgressInsight(stats: DashboardStats | null | undefined): string {
  void stats;
  return "Po pierwszej sesji pojawi si\u0119 tu Tw\u00f3j wynik i kr\u00f3tkie podsumowanie.";
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

function activityStatusLabel(session: DashboardSession): { label: string; className: string } {
  if (session.status === "in_progress") {
    return {
      label: "W toku",
      className: "border-amber-300/28 bg-amber-500/12 text-amber-100",
    };
  }

  return {
    label: "Zako\u0144czona",
    className: "border-emerald-300/28 bg-emerald-500/12 text-emerald-100",
  };
}

export default function E8AuthenticatedDashboard({
  accessToken,
  userDisplayName,
  shouldRunOnboarding,
}: AuthenticatedDashboardProps) {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [optionsToastVisible, setOptionsToastVisible] = useState(false);
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(shouldRunOnboarding);
  const optionsToastTimerRef = useRef<number | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);
  const [aiSummaryRefreshLockedUntil, setAiSummaryRefreshLockedUntil] = useState<string | null>(null);
  const [aiSummaryNotice, setAiSummaryNotice] = useState<string | null>(null);
  const [summaryClockTick, setSummaryClockTick] = useState(() => Date.now());
  const [expandedActivitySessionId, setExpandedActivitySessionId] = useState<string | null>(null);
  const [showAllActivityItems, setShowAllActivityItems] = useState(false);

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

        setLoadError("Nie uda\u0142o si\u0119 pobra\u0107 danych dashboardu.");
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

  const showQuizOptionsToast = () => {
    if (optionsToastTimerRef.current !== null) {
      window.clearTimeout(optionsToastTimerRef.current);
      optionsToastTimerRef.current = null;
    }

    setOptionsToastVisible(true);
    optionsToastTimerRef.current = window.setTimeout(() => {
      setOptionsToastVisible(false);
      optionsToastTimerRef.current = null;
    }, 2100);
  };

  useEffect(() => {
    if (shouldRunOnboarding) {
      setOnboardingVisible(true);
    }
  }, [shouldRunOnboarding]);

  useEffect(() => {
    return () => {
      if (optionsToastTimerRef.current !== null) {
        window.clearTimeout(optionsToastTimerRef.current);
      }
    };
  }, []);

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
    if (!stats) {
      return [
        {
          label: "Uko\u0144czone sesje",
          value: "0",
          note: "zamkni\u0119te treningi",
        },
        {
          label: "Rozwi\u0105zane pytania",
          value: "0",
          note: "w zako\u0144czonych sesjach",
        },
      ] as DashboardStatTile[];
    }

    const items: DashboardStatTile[] = [
      {
        label: "Uko\u0144czone sesje",
        value: String(stats.sessionsCompleted),
        note: "zamkni\u0119te treningi",
      },
      {
        label: "Rozwi\u0105zane pytania",
        value: String(stats.solvedQuestions),
        note: "w zako\u0144czonych sesjach",
      },
    ];

    if (stats.averageScorePercent !== null) {
      items.unshift({
        label: "\u015arednia skuteczno\u015b\u0107",
        value: `${Math.round(stats.averageScorePercent)}%`,
        note: "aktualny trend",
      });
    }

    if (stats.averageDurationMinutes !== null) {
      items.push({
        label: "\u015aredni czas sesji",
        value: `${stats.averageDurationMinutes.toFixed(1)} min`,
        note: "tempo pracy",
      });
    }

    return items;
  }, [stats]);
  const inProgressSession = useMemo(
    () => recentSessions.find((session) => session.status === "in_progress") ?? null,
    [recentSessions],
  );

  const latestCompletedSession = useMemo(
    () => recentSessions.find((session) => session.status === "completed" || session.scorePercent !== null) ?? null,
    [recentSessions],
  );

  const primaryMode = recommendedSet?.mode ?? visibleSets[0]?.mode ?? "reactions";
  const primarySetId = recommendedSet?.id ?? visibleSets[0]?.id ?? null;
  const startHrefParams = new URLSearchParams({ mode: primaryMode });
  if (primarySetId) {
    startHrefParams.set("set", primarySetId);
  }
  const startHref = `/e8/quiz?${startHrefParams.toString()}`;
  const progressInsight = buildProgressInsight(stats);
  const latestScorePercent = latestCompletedSession?.scorePercent ?? stats?.lastScorePercent ?? null;
  const latestScoreOutOfTen =
    latestScorePercent !== null && Number.isFinite(latestScorePercent) ? Math.round((latestScorePercent / 100) * 10) : null;
  const latestDurationMinutes = latestCompletedSession?.durationMinutes ?? stats?.averageDurationMinutes ?? null;
  const accessTier = data?.tier ?? null;
  const showUczenPlusBox = accessTier === "premium" || accessTier === "premium_plus";
  const hasPremiumAccess = showUczenPlusBox;
  const isPremiumStatusLoading = isLoading && !data;
  const showSkeleton = isLoading && !onboardingVisible;
  const showAvailablePlanPromo = !showUczenPlusBox && (accessTier === "registered" || accessTier === "unregistered");
  const hasAiSummaryAccess = hasPremiumAccess;
  const activitySessions = useMemo(() => recentSessions.slice(0, ACTIVITY_MAX_LIMIT), [recentSessions]);
  const visibleRecentSessions = useMemo(
    () => (showAllActivityItems ? activitySessions : activitySessions.slice(0, ACTIVITY_PREVIEW_LIMIT)),
    [activitySessions, showAllActivityItems],
  );
  useEffect(() => {
    if (activitySessions.length === 0) {
      setExpandedActivitySessionId(null);
      return;
    }

    setExpandedActivitySessionId((current) => {
      if (current && activitySessions.some((session) => session.id === current)) {
        return current;
      }

      return null;
    });
  }, [activitySessions]);

  useEffect(() => {
    if (showAllActivityItems) {
      return;
    }

    const visibleIds = new Set(activitySessions.slice(0, ACTIVITY_PREVIEW_LIMIT).map((session) => session.id));

    if (expandedActivitySessionId && !visibleIds.has(expandedActivitySessionId)) {
      setExpandedActivitySessionId(null);
    }
  }, [activitySessions, expandedActivitySessionId, showAllActivityItems]);

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

  useEffect(() => {
    if (!hasAiSummaryAccess) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSummaryClockTick(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasAiSummaryAccess]);

  const aiSummaryCanRefresh = useMemo(() => {
    if (!hasAiSummaryAccess || aiSummaryLoading) {
      return false;
    }

    if (!aiSummaryRefreshLockedUntil) {
      return true;
    }

    const unix = Date.parse(aiSummaryRefreshLockedUntil);

    if (!Number.isFinite(unix)) {
      return true;
    }

    return summaryClockTick >= unix;
  }, [aiSummaryLoading, aiSummaryRefreshLockedUntil, hasAiSummaryAccess, summaryClockTick]);


  const heroIntro = useMemo(() => resolveHeroIntroCopy(stats?.sessionsCompleted), [stats?.sessionsCompleted]);
  const strongestModeLabel = stats?.strongestMode ? formatMode(stats.strongestMode) : "Po sesji";
  const weakestModeLabel = stats?.weakestMode ? formatMode(stats.weakestMode) : "Po sesji";
  const hasStrongestMode = Boolean(stats?.strongestMode);
  const hasWeakestMode = Boolean(stats?.weakestMode);
  const tutorialActive = onboardingVisible;
  const tutorialStateIndex = 0;
  const displayHeroIntro = tutorialActive ? TUTORIAL_HERO_STATES[tutorialStateIndex] : heroIntro;
  const displayLatestResult = tutorialActive
    ? TUTORIAL_LATEST_RESULT_STATES[tutorialStateIndex]
    : null;
  const displayProgressInsight = tutorialActive
    ? TUTORIAL_PROGRESS_INSIGHTS[tutorialStateIndex]
    : progressInsight;
  const displayStatTiles = tutorialActive
    ? TUTORIAL_STAT_TILE_STATES[0]
    : statTiles;
  const displayModeState = tutorialActive
    ? TUTORIAL_MODE_STATES[0]
    : null;
  const displayStrongestModeLabel = displayModeState ? displayModeState.strongest : strongestModeLabel;
  const displayWeakestModeLabel = displayModeState ? displayModeState.weakest : weakestModeLabel;
  const displayHasStrongestMode = displayModeState ? true : hasStrongestMode;
  const displayHasWeakestMode = displayModeState ? true : hasWeakestMode;
  const displayNextStepText = tutorialActive
    ? TUTORIAL_NEXT_STEP_STATES[tutorialStateIndex]
    : "Zacznij pierwsz\u0105 sesj\u0119, aby od razu odblokowa\u0107 konkretne nast\u0119pne kroki.";
  const displayActivityText = tutorialActive
    ? TUTORIAL_ACTIVITY_STATES[tutorialStateIndex]
    : "Jeszcze nie masz historii. Po pierwszej sesji pojawi si\u0119 tu podsumowanie.";
  const displayPromoText = tutorialActive
    ? (
      showAvailablePlanPromo
        ? TUTORIAL_PROMO_STATES[tutorialStateIndex]
        : TUTORIAL_UCZEN_PLUS_STATES[tutorialStateIndex]
    )
    : (
      showAvailablePlanPromo
        ? "Odblokuj dost\u0119p do trening\u00F3w E8, wynik\u00F3w i kr\u00F3tkich wyja\u015Bnie\u0144."
        : "Nowe opcje nauki pojawi\u0105 si\u0119 ju\u017C wkr\u00F3tce."
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
        title: "Doko\u0144cz rozpocz\u0119t\u0105 sesj\u0119",
        description: `${formatMode(inProgressSession.mode)} - wracasz dok\u0142adnie tam, gdzie przerwa\u0142e\u015b`,
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
        description: "10 pyta\u0144 - 6-9 min",
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
        cta: "Przejd\u017a",
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
    <main className="min-h-screen bg-[#050510] text-white selection:bg-indigo-500/30">
      <MobileHeader />

      <div className="relative mx-auto w-full max-w-[88rem] px-5 pt-8 pb-12 md:px-6 md:pt-10 lg:px-9 lg:pb-14 xl:px-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:items-stretch">
          <article data-tour="dashboard-welcome" className="dashboard-enter dashboard-card-hover relative overflow-hidden rounded-3xl border border-indigo-200/20 bg-[linear-gradient(145deg,rgba(16,21,42,0.98),rgba(10,14,30,0.95))] p-8 shadow-[0_36px_90px_-58px_rgba(79,70,229,0.8)] md:p-10 xl:min-h-[32rem]" style={{ animationDelay: "20ms" }}>
            <CardAccent preset="hero" className="dashboard-drift" />
            {hasPremiumAccess ? (
              <div
                aria-hidden
                className="dashboard-breathe pointer-events-none absolute -top-8 -right-10 h-44 w-64 rounded-full bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),rgba(16,185,129,0)_72%)]"
              />
            ) : null}

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2">
                  <SectionIcon icon={Zap} tone="amber" />
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-indigo-100/82 uppercase">PANEL UCZNIA E8</p>
                </div>
                <div className="flex min-h-[1.25rem] items-center">
                  {isPremiumStatusLoading ? (
                    <span
                      aria-hidden
                      className="inline-flex h-5 w-[6.75rem] rounded-md border border-white/16 bg-[linear-gradient(110deg,rgba(255,255,255,0.06),rgba(255,255,255,0.18),rgba(255,255,255,0.06))] bg-[length:220%_100%] dashboard-wave motion-reduce:animate-none"
                    />
                  ) : hasPremiumAccess ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/18 bg-emerald-300/[0.07] px-2 py-1 text-[10px] font-semibold tracking-[0.03em] text-emerald-100/88">
                      Plan aktywny
                    </span>
                  ) : null}
                </div>
              </div>

              <h1 className="mt-3 text-3xl leading-tight text-white md:text-[2.25rem]" style={{ fontFamily: "var(--font-figtree)", fontWeight: 900 }}>{displayHeroIntro.headline}</h1>
              <p className="mt-2 text-base font-medium text-indigo-100/88">{displayHeroIntro.line1}</p>
              <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-indigo-100/76">{displayHeroIntro.line2}</p>
              <div className="relative mt-6 flex w-full items-center gap-3">
                <Link
                  href={startHref}
                  data-tour="dashboard-start-cta"
                  className="dashboard-btn-hover inline-flex h-12 w-full flex-1 items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-5 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(79,70,229,0.98)] transition-[transform,filter] duration-150 hover:brightness-110 active:scale-[0.99]"
                >
                  {"Zacznij sesj\u0119"}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {inProgressSession ? (
                  <Link
                    href={sessionHref(inProgressSession)}
                    className="dashboard-btn-hover inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/16 bg-white/[0.05] px-4 text-sm font-semibold text-indigo-100/90 transition-[border-color,background-color] duration-150 hover:border-white/28 hover:bg-white/[0.08]"
                  >
                    {"Wr\u00f3\u0107 do sesji"}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={showQuizOptionsToast}
                    className="dashboard-btn-hover inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/16 bg-white/[0.045] text-indigo-100/88 transition-[border-color,background-color] duration-150 hover:border-white/28 hover:bg-white/[0.08]"
                    aria-label="Opcje quizu (wkr\u00f3tce)"
                    title="Opcje quizu (wkr\u00f3tce)"
                  >
                    <Settings className="h-[18px] w-[18px]" />
                  </button>
                )}
              </div>

              <div data-tour="dashboard-latest-result" className={cn("mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]", showSkeleton && "dashboard-loading-blur")}>
                <div className="px-4 pt-4 pb-2">
                  <p className="text-[11px] font-semibold tracking-[0.1em] text-indigo-200/75 uppercase">Ostatni wynik</p>
                </div>

                <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
                  <div className="px-4 py-3.5">
                    <p className="text-[11px] font-semibold tracking-[0.08em] text-indigo-200/65 uppercase">WYNIK</p>
                    <p className="mt-1 text-xl font-bold text-white">
                      {showSkeleton ? (
                        <SkeletonWave className="h-7 w-20 rounded-lg" />
                      ) : displayLatestResult ? (
                        displayLatestResult.scoreOutOfTen
                      ) : latestScoreOutOfTen !== null ? (
                        `${latestScoreOutOfTen}/10`
                      ) : (
                        "--/10"
                      )}
                    </p>
                  </div>

                  <div className="px-4 py-3.5">
                    <p className="text-[11px] font-semibold tracking-[0.08em] text-indigo-200/65 uppercase">Procenty</p>
                    <p className="mt-1 text-xl font-bold text-white">
                      {showSkeleton ? (
                        <SkeletonWave className="h-7 w-20 rounded-lg" />
                      ) : displayLatestResult ? (
                        displayLatestResult.scorePercent
                      ) : latestScorePercent !== null ? (
                        `${Math.round(latestScorePercent)}%`
                      ) : (
                        "--%"
                      )}
                    </p>
                  </div>

                  <div className="px-4 py-3.5">
                    <p className="text-[11px] font-semibold tracking-[0.08em] text-indigo-200/65 uppercase">CZAS</p>
                    <p className="mt-1 text-xl font-bold text-white">
                      {showSkeleton ? (
                        <SkeletonWave className="h-7 w-20 rounded-lg" />
                      ) : displayLatestResult ? (
                        displayLatestResult.duration
                      ) : latestDurationMinutes !== null && Number.isFinite(latestDurationMinutes) ? (
                        `${latestDurationMinutes.toFixed(1)} min`
                      ) : (
                        "--"
                      )}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-3">
                  <p className="text-xs text-indigo-100/62">{displayLatestResult ? displayLatestResult.note : "Uzupe\u0142ni si\u0119 po pierwszej sesji"}</p>
                </div>
              </div>

              <div className={cn("mt-4 overflow-hidden rounded-2xl border border-indigo-200/14 bg-[linear-gradient(160deg,rgba(14,20,39,0.96),rgba(9,13,28,0.94))] p-4", showSkeleton && "dashboard-loading-blur")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex items-center gap-2">
                    <SectionIcon icon={Sparkles} tone="violet" />
                    <div>
                      <p className="text-[11px] font-semibold tracking-[0.1em] text-indigo-200/75 uppercase">AI podsumowanie</p>
                      <p className="text-xs text-indigo-100/62">5 ostatnich sesji</p>
                    </div>
                  </div>

                  {showSkeleton ? (
                    <SkeletonWave className="h-8 w-20 rounded-lg" />
                  ) : hasAiSummaryAccess ? (
                    <button
                      type="button"
                      onClick={() => {
                        void loadAiSummary(true);
                      }}
                      disabled={!aiSummaryCanRefresh || aiSummaryLoading}
                      className={cn(
                        "dashboard-btn-hover inline-flex h-8 items-center justify-center rounded-lg border border-white/16 bg-white/[0.05] px-3 text-[11px] font-semibold text-indigo-100/90 transition-[border-color,background-color,opacity] duration-150 hover:border-white/28 hover:bg-white/[0.08]",
                        (!aiSummaryCanRefresh || aiSummaryLoading) && "cursor-not-allowed opacity-60 hover:border-white/16 hover:bg-white/[0.05]",
                      )}
                    >
                      {aiSummaryLoading ? "Ladowanie..." : "Odswiez"}
                    </button>
                  ) : null}
                </div>

                {showSkeleton ? (
                  <div className="mt-3 space-y-2">
                    <SkeletonWave className="h-4 w-full rounded" />
                    <SkeletonWave className="h-4 w-[94%] rounded" />
                    <SkeletonWave className="h-4 w-[88%] rounded" />
                    <SkeletonWave className="h-3 w-28 rounded" />
                  </div>
                ) : !hasAiSummaryAccess ? (
                  <div className="mt-3 rounded-xl border border-emerald-300/22 bg-emerald-500/[0.07] p-3">
                    <p className="text-sm leading-relaxed text-emerald-100/88">Ta funkcja jest dostepna w planie Uczen i Uczen+.</p>
                    <button
                      type="button"
                      onClick={() => setPlansModalOpen(true)}
                      className="dashboard-btn-hover mt-2 inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-emerald-200/38 bg-[linear-gradient(180deg,rgba(16,185,129,0.3),rgba(5,150,105,0.2))] px-2.5 text-[11px] font-semibold text-emerald-50 transition-[border-color,filter] duration-150 hover:border-emerald-100/55 hover:brightness-110"
                    >
                      Odblokuj plan
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                ) : aiSummaryLoading ? (
                  <div className="mt-3 space-y-2">
                    <SkeletonWave className="h-4 w-full rounded" />
                    <SkeletonWave className="h-4 w-[94%] rounded" />
                    <SkeletonWave className="h-4 w-[88%] rounded" />
                  </div>
                ) : aiSummaryError ? (
                  <p className="mt-3 text-sm text-red-100/85">{aiSummaryError}</p>
                ) : (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-indigo-100/86">
                    {aiSummary ?? "Po kilku sesjach pojawi sie tutaj AI podsumowanie Twojego trendu."}
                  </p>
                )}



                {hasAiSummaryAccess && aiSummaryNotice && !showSkeleton ? (
                  <p className="mt-2 text-[11px] text-indigo-200/60">{aiSummaryNotice}</p>
                ) : null}
              </div>
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute right-5 bottom-6 z-20 hidden md:block select-none bg-[linear-gradient(180deg,rgba(190,205,238,0.22)_0%,rgba(145,161,205,0.14)_44%,rgba(86,99,141,0.06)_100%)] bg-clip-text text-[0.57rem] tracking-[0.04em] text-transparent opacity-32 [text-shadow:0_1px_0_rgba(255,255,255,0.18),0_-1px_0_rgba(0,0,0,0.66)] md:text-[0.8rem]" style={{ fontFamily: "var(--font-figtree)", fontWeight: 900 }}
            >
              nAIczyciel
            </div>
          </article>
          <div className="grid gap-5">
            <article className={cn("dashboard-enter dashboard-card-hover relative overflow-hidden rounded-3xl border p-5 md:p-6 xl:min-h-[8.5rem]", isPremiumStatusLoading && "dashboard-loading-blur", showAvailablePlanPromo ? "border-emerald-300/36 bg-[linear-gradient(152deg,rgba(9,26,25,0.96),rgba(7,20,21,0.95))] shadow-[0_24px_44px_-28px_rgba(16,185,129,0.65)]" : "border-slate-100/24 bg-[linear-gradient(152deg,rgba(18,22,36,0.97),rgba(10,14,26,0.95))] shadow-[0_18px_34px_-26px_rgba(226,232,240,0.5)]")} style={{ animationDelay: "90ms" }}>
              <div
                aria-hidden
                className={cn("dashboard-breathe pointer-events-none absolute -top-8 -right-10 h-28 w-40 rounded-full", showAvailablePlanPromo ? "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.26),rgba(16,185,129,0)_72%)]" : "bg-[radial-gradient(circle_at_top_right,rgba(226,232,240,0.2),rgba(226,232,240,0)_72%)]")}
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
                  <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]", showAvailablePlanPromo ? "border border-emerald-300/35 bg-emerald-400/16 text-emerald-100" : "border border-cyan-300/28 bg-cyan-400/10 text-cyan-100")}>
                    <GraduationCap className="h-3.5 w-3.5" />
                  </span>
                  <h2 className={cn("text-xs font-semibold tracking-[0.08em] uppercase", showAvailablePlanPromo ? "text-emerald-50" : "text-slate-100")}>
                    {showAvailablePlanPromo ? "UCZE\u0143" : "Ucze\u0144+ wkr\u00f3tce"}
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

            <article data-tour="dashboard-progress" className="dashboard-enter dashboard-card-hover relative overflow-hidden rounded-3xl border border-white/12 bg-[linear-gradient(160deg,rgba(12,17,34,0.96),rgba(8,11,25,0.95))] p-7 md:p-8 xl:min-h-[21rem]" style={{ animationDelay: "150ms" }}>
              <CardAccent preset="progress" className="dashboard-drift" />

              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2">
                    <SectionIcon icon={ChartNoAxesColumn} tone="sky" />
                    <h2 className="text-sm font-semibold tracking-[0.08em] text-indigo-100 uppercase">{"Post\u0119p"}</h2>
                  </div>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-indigo-100/78">
                  {displayProgressInsight}
                </p>

                {showSkeleton ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    {[0, 1].map((idx) => (
                      <div key={`progress-skeleton-${idx}`} className="dashboard-loading-blur rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <SkeletonWave className="h-3 w-28 rounded" />
                        <SkeletonWave className="mt-2 h-8 w-20 rounded-lg" />
                        <SkeletonWave className="mt-2 h-3 w-24 rounded" />
                      </div>
                    ))}
                  </div>
                ) : loadError ? (
                  <p className="mt-4 text-sm text-red-100/80">{"Nie mog\u0119 teraz odczyta\u0107 statystyk. Spr\u00f3buj ponownie po chwili."}</p>
                ) : displayStatTiles.length === 0 ? (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                    <p className="text-sm text-indigo-100/78">Po pierwszej sesji pojawi\u0105 si\u0119 tu statystyki.</p>
                    <Link
                      href={startHref}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-100/88 transition-colors hover:text-white"
                    >
                      Start pierwszej sesji
                      </Link>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    {displayStatTiles.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[11px] font-semibold tracking-[0.1em] text-indigo-200/70 uppercase">{item.label}</p>
                        <p className="mt-1 text-2xl font-bold text-white">{item.value}</p>
                        <p className="mt-1 text-xs text-indigo-100/62">{item.note}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div
                    className={cn(
                      "rounded-2xl border p-4",
                      showSkeleton && "dashboard-loading-blur",
                      displayHasStrongestMode
                        ? "border-[#7EE7C4]/28 bg-[radial-gradient(ellipse_110%_92%_at_center,rgba(126,231,196,0.14)_0%,rgba(126,231,196,0.05)_44%,rgba(255,255,255,0.02)_100%)] shadow-[inset_0_1px_0_rgba(126,231,196,0.12)]"
                        : "border-[#7EE7C4]/18 bg-[radial-gradient(ellipse_110%_92%_at_center,rgba(126,231,196,0.10)_0%,rgba(126,231,196,0.03)_42%,rgba(255,255,255,0.02)_100%)] shadow-[inset_0_1px_0_rgba(126,231,196,0.06)]",
                    )}
                  >
                    <p
                      className={cn(
                        "text-[11px] font-semibold tracking-[0.1em] uppercase",
                        displayHasStrongestMode ? "text-[#7EE7C4]/90" : "text-[#7EE7C4]/70",
                      )}
                    >
                      Mocna strona
                    </p>
                    <p className={cn("mt-1 text-lg font-semibold", displayHasStrongestMode ? "text-[#D7FAEF]" : "text-white/90")}>{showSkeleton ? <SkeletonWave className="h-7 w-24 rounded-lg" />  : displayStrongestModeLabel}</p>
                  </div>

                  <div
                    className={cn(
                      "rounded-2xl border p-4",
                      showSkeleton && "dashboard-loading-blur",
                      displayHasWeakestMode
                        ? "border-[#F4C86A]/28 bg-[radial-gradient(ellipse_110%_92%_at_center,rgba(244,200,106,0.14)_0%,rgba(244,200,106,0.05)_44%,rgba(255,255,255,0.02)_100%)] shadow-[inset_0_1px_0_rgba(244,200,106,0.12)]"
                        : "border-[#F4C86A]/18 bg-[radial-gradient(ellipse_110%_92%_at_center,rgba(244,200,106,0.10)_0%,rgba(244,200,106,0.03)_42%,rgba(255,255,255,0.02)_100%)] shadow-[inset_0_1px_0_rgba(244,200,106,0.06)]",
                    )}
                  >
                    <p
                      className={cn(
                        "text-[11px] font-semibold tracking-[0.1em] uppercase",
                        displayHasWeakestMode ? "text-[#F4C86A]/90" : "text-[#F4C86A]/70",
                      )}
                    >
                      Do poprawy
                    </p>
                    <p className={cn("mt-1 text-lg font-semibold", displayHasWeakestMode ? "text-[#FAEBC6]" : "text-white/90")}>{showSkeleton ? <SkeletonWave className="h-7 w-24 rounded-lg" />  : displayWeakestModeLabel}</p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
        <section className="mt-5 grid items-start gap-4 xl:grid-cols-2">
          <article className="order-2 self-start md:order-1 dashboard-enter dashboard-card-hover overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(155deg,rgba(10,15,31,0.92),rgba(7,11,23,0.9))]" style={{ animationDelay: "220ms" }}>
            <div className="p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2">
                  <SectionIcon icon={ListChecks} tone="violet" />
                  <h2 className="text-sm font-semibold tracking-[0.08em] text-indigo-100 uppercase">{"Nast\u0119pny krok"}</h2>
                </div>
              </div>

              {showSkeleton ? (
                <div className="dashboard-loading-blur mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                  <SkeletonWave className="h-4 w-44 rounded" />
                  <SkeletonWave className="mt-2 h-3 w-24 rounded" />
                  <SkeletonWave className="mt-3 h-4 w-18 rounded" />
                </div>
              ) : nextStepActions.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                  <p className="text-sm text-indigo-100/78">{displayNextStepText}</p>
                </div>
              ) : (
                <div className="mt-3 w-full">
                  <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0a1227]/38 px-4 py-9 backdrop-blur-md">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -top-10 -left-12 h-32 w-56 rounded-full bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),rgba(59,130,246,0.14)_34%,rgba(59,130,246,0)_74%)]"
                    />
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
                    <p className="text-center text-base font-semibold tracking-[0.08em] text-indigo-100 uppercase">{tutorialActive ? displayNextStepText : "Wkr\u00F3tce."}</p>
                  </div>
                </div>
              )}
            </div>
          </article>

          <article
            id="ostatnia-aktywnosc"
            className="order-1 self-start md:order-2 dashboard-enter dashboard-card-hover overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(155deg,rgba(10,15,31,0.92),rgba(7,11,23,0.9))]"
            style={{ animationDelay: "280ms" }}
          >
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2">
                  <SectionIcon icon={Clock3} tone="emerald" />
                  <h2 className="text-sm font-semibold tracking-[0.08em] text-indigo-100 uppercase">{"Ostatnia aktywno\u015b\u0107"}</h2>
                </div>
                {activitySessions.length > ACTIVITY_PREVIEW_LIMIT ? (
                  <button
                    type="button"
                    onClick={() => setShowAllActivityItems((current) => !current)}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/12 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-indigo-100/90 transition-colors duration-150 hover:border-white/20 hover:text-white"
                  >
                    {showAllActivityItems ? "Zwi\u0144 list\u0119" : `Poka\u017C wi\u0119cej (${activitySessions.length - ACTIVITY_PREVIEW_LIMIT})`}
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", showAllActivityItems && "rotate-180")} />
                  </button>
                ) : null}
              </div>

              {showSkeleton ? (
                <div className="dashboard-loading-blur mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                  <SkeletonWave className="h-4 w-72 rounded" />
                  <SkeletonWave className="mt-3 h-4 w-36 rounded" />
                </div>
              ) : activitySessions.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                  <p className="text-sm text-indigo-100/78">{displayActivityText}</p>
                  <Link
                    href={startHref}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-100/88 transition-colors hover:text-white"
                  >
                    Zacznij teraz
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="mt-4 space-y-2.5">
                  <AnimatePresence initial={false}>
                    {visibleRecentSessions.map((session) => {
                      const status = activityStatusLabel(session);
                      const duration = formatDurationLabel(session.durationMinutes);
                      const questionCount = session.totalQuestions && session.totalQuestions > 0 ? `${session.totalQuestions} pyta\u0144` : null;
                      const isExpanded = expandedActivitySessionId === session.id;

                      return (
                        <motion.div
                          key={session.id}
                          layout
                          initial={{ height: 0, opacity: 0, y: -6 }}
                          animate={{ height: "auto", opacity: 1, y: 0 }}
                          exit={{ height: 0, opacity: 0, y: -6 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="rounded-2xl border border-white/10 bg-white/[0.04]">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedActivitySessionId((current) =>
                                  current === session.id ? null : session.id,
                                )
                              }
                              aria-expanded={isExpanded}
                              className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
                            >
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-white">{formatMode(session.mode)}</p>
                                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", status.className)}>
                                    {status.label}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-indigo-100/65">
                                  {formatSessionDate(session)}
                                  {session.scorePercent !== null ? ` - ${Math.round(session.scorePercent)}%` : ""}
                                  {questionCount ? ` - ${questionCount}` : ""}
                                </p>
                              </div>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 shrink-0 text-indigo-100/60 transition-transform duration-200",
                                  isExpanded && "rotate-180 text-indigo-100/90",
                                )}
                              />
                            </button>

                            <AnimatePresence initial={false}>
                              {isExpanded ? (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2, ease: "easeOut" }}
                                  className="overflow-hidden"
                                >
                                  <div className="border-t border-white/10 px-3.5 py-3">
                                    <div className="grid gap-2 text-xs text-indigo-100/72 sm:grid-cols-2">
                                      <p>
                                        Wynik: {session.scorePercent !== null ? `${Math.round(session.scorePercent)}%` : "w trakcie"}
                                      </p>
                                      <p>
                                        Czas: {duration ?? "w trakcie"}
                                      </p>
                                      <p>
                                        Pytania: {questionCount ?? "-"}
                                      </p>
                                      <p>
                                        Poprawne: {session.correctAnswers !== null ? session.correctAnswers : "-"}
                                      </p>
                                    </div>
                                    <div className="mt-3">
                                      <Link
                                        href={sessionHref(session)}
                                        className="inline-flex rounded-lg border border-white/16 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-indigo-100 transition-[border-color,background-color] duration-150 hover:border-white/28 hover:bg-white/[0.08]"
                                      >
                                        {sessionActionLabel(session)}
                                      </Link>
                                    </div>
                                  </div>
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  
                </div>
              )}
            </div>
          </article>
        </section>
<div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent via-[#050510]/50 to-[#050510]"
        />
      </div>
    
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-6 z-[85] flex justify-center px-4 transition-all duration-250",
          optionsToastVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
        aria-live="polite"
      >
        <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-200/25 bg-[#0b1130]/90 px-3.5 py-2 text-xs font-semibold text-indigo-100 shadow-[0_14px_34px_-22px_rgba(79,70,229,0.75)] backdrop-blur-md">
          <Settings className="h-3.5 w-3.5 text-indigo-200/90" />
          {"Opcje quizu wkr\u00f3tce"}
        </div>
      </div>
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
                      whileTap={modalMotion.buttonTap}
                      className={cn(
                        "mt-4 w-full rounded-xl border py-2.5 text-sm font-semibold transition-[transform,filter,background-color,border-color] duration-200",
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





























