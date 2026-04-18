"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Brain, CheckCheck, Languages, Sparkles } from "lucide-react";
import { AnswerList } from "@/components/quiz/answer-list";
import { AnswerOption } from "@/components/quiz/answer-option";
import { ExplanationPanel } from "@/components/quiz/explanation-panel";
import { QuestionCard } from "@/components/quiz/question-card";
import { QuizFooterAction } from "@/components/quiz/quiz-footer-action";
import { QuizHeader } from "@/components/quiz/quiz-header";
import { QuizQuestionNav, type QuestionStatus } from "@/components/quiz/quiz-question-nav";
import { ResultsHeader } from "@/components/quiz/results-header";
import { QuizSummaryCard } from "@/components/quiz/quiz-summary-card";
import { QuizUtilityRow } from "@/components/quiz/quiz-utility-row";
import { QuizOnboardingOverlay, type QuizOnboardingStep } from "@/components/quiz/quiz-onboarding-overlay";
import {
  QUIZ_ACTIVE_SESSION_STORAGE_KEY,
  QUIZ_ONBOARDING_SESSION_STORAGE_KEY,
  QUIZ_ONBOARDING_STORAGE_KEY,
  getProgressStorageKey,
  type ActiveQuizSessionMap,
} from "@/lib/quiz/storage-keys";
import type { QuizAnswerSnapshot, QuizOption, QuizQuestion, QuizSessionPayload, QuizSummary } from "@/lib/quiz/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { QUIZ_SOUND_MUTED_STORAGE_KEY, quizSoundManager } from "@/lib/quiz/quiz-sound-manager";

type QuizScreenProps = {
  sessionId: string;
  initialMode: string;
  initialReviewMode?: boolean;
  initialSetId?: string;
  initialCount?: string;
  initialModes?: string;
  initialFocus?: string;
  initialFocusSource?: string;
  initialFocusRaw?: string;
};

type SessionStatus = "idle" | "answered_correct" | "answered_incorrect" | "loading_next" | "finished";

type LocalAnswerState = QuizAnswerSnapshot & {
  saveState: "pending" | "saved" | "error";
};

type SaveAnswerPayload = {
  questionId: string;
  optionId: string;
  isCorrect: boolean;
};

type AnswerableItem = {
  id: string;
  prompt: string;
  options: QuizOption[];
};

function toModeLabel(mode: string): string {
  if (mode === "reactions") {
    return "Reakcje";
  }

  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function toDisplayTaskTitle(title: string, type: QuizQuestion["type"]): string {
  const cleaned = title.trim();

  if (!cleaned) {
    return "";
  }

  const normalized = cleaned.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  if (normalized.includes("mock") && normalized.includes("reading mc")) {
    return "Przykładowe czytanie";
  }

  if (normalized.includes("mock") && normalized.includes("gap fill text")) {
    return "Przykładowe uzupełnianie tekstu";
  }

  if (normalized === "reading mc") {
    return "Czytanie";
  }

  if (normalized === "gap_fill_text") {
    return "Uzupełnianie tekstu";
  }

  if (type !== "single_question") {
    return cleaned.replace(/[_-]+/g, " ");
  }

  return cleaned;
}

function sanitizeWarning(value: string): string {
  return value.replace(/^uwaga\s*:\s*/i, "").trim();
}

function resolveHintText(question: QuizQuestion | null): string {
  if (!question) {
    return "";
  }

  if (question.hintText) {
    const cleaned = question.hintText.trim();

    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  if (question.patternTip) {
    const cleaned = question.patternTip.replace(/^pattern\s*:\s*/i, "").trim();

    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  if (question.warningTip) {
    const cleaned = sanitizeWarning(question.warningTip);

    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  return "Pomysl, jaka reakcja bylaby naturalna w tym kontekscie."; /*

  return "Zwróć uwagę na naturalny ton reakcji i unikaj tłumaczenia dosłownego.";
*/
}

function getAnswerableItems(question: QuizQuestion | null): AnswerableItem[] {
  if (!question) {
    return [];
  }

  if (question.type === "single_question") {
    return [
      {
        id: question.id,
        prompt: question.prompt,
        options: question.options,
      },
    ];
  }

  return question.questions.map((item) => ({
    id: item.id,
    prompt: item.prompt,
    options: item.options,
  }));
}

function getAnswerableItemsMap(questions: QuizQuestion[]) {
  return new Map(
    questions.flatMap((question) =>
      getAnswerableItems(question).map((item) => [item.id, item] as const),
    ),
  );
}

function isQuestionFullyAnswered(question: QuizQuestion | null, answers: Record<string, LocalAnswerState>) {
  const items = getAnswerableItems(question);
  return items.length > 0 && items.every((item) => Boolean(answers[item.id]));
}

function getQuestionResult(question: QuizQuestion | null, answers: Record<string, LocalAnswerState>) {
  const items = getAnswerableItems(question);
  const correct = items.filter((item) => answers[item.id]?.isCorrect).length;

  return {
    total: items.length,
    correct,
  };
}

type GapChipState = {
  text?: string;
  status: "empty" | "draft" | "correct" | "wrong";
};

function renderGapFillPassage(params: {
  passage: string;
  chipStateById: Map<string, GapChipState>;
}) {
  const { passage, chipStateById } = params;
  const parts: React.ReactNode[] = [];
  const tokenRegex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(passage)) !== null) {
    const [fullMatch, tokenId] = match;
    const textBefore = passage.slice(lastIndex, match.index);

    if (textBefore) {
      parts.push(textBefore);
    }

    const chipState = chipStateById.get(tokenId) ?? { status: "empty" as const };
    const answeredText = chipState.text?.trim();

    parts.push(
      <span
        key={`gap-token-${tokenId}-${match.index}`}
        className={`mx-0.5 inline-flex min-h-[1.9rem] items-center rounded-md border px-2.5 py-0.5 align-middle text-[11px] font-semibold transition-colors xl:min-h-[2rem] ${
          chipState.status === "correct"
            ? "border-emerald-300/26 bg-emerald-500/10 text-emerald-50"
            : chipState.status === "wrong"
              ? "border-rose-300/28 bg-rose-500/10 text-rose-50"
              : chipState.status === "draft"
                ? "border-indigo-300/24 bg-indigo-500/[0.08] text-indigo-100/92"
                : "border-indigo-300/20 bg-indigo-500/[0.06] text-indigo-100/92"
        }`}
      >
        {answeredText ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`font-mono text-[11px] ${
                chipState.status === "wrong"
                  ? "text-rose-100/72 line-through decoration-rose-300/50"
                  : chipState.status === "correct"
                    ? "text-emerald-100/70"
                    : "text-indigo-100/70"
              }`}
            >
              {tokenId}
            </span>
            <span className="truncate">{answeredText}</span>
          </span>
        ) : (
          <span className="inline-flex items-end gap-1.5">
            <span className="border-b border-dashed border-indigo-200/46 px-1 pb-[1px] text-transparent select-none">word</span>
            <span className="translate-y-[-2px] font-mono text-[10px] text-indigo-100/74">{tokenId}</span>
          </span>
        )}
      </span>,
    );

    lastIndex = match.index + fullMatch.length;
  }

  const trailingText = passage.slice(lastIndex);

  if (trailingText) {
    parts.push(trailingText);
  }

  return parts;
}

function renderGapFillReviewedOptions(params: {
  item: AnswerableItem;
  selectedOptionId: string | null;
}) {
  const { item, selectedOptionId } = params;
  const correctOption = item.options.find((option) => option.isCorrect) ?? null;
  const selectedOption = item.options.find((option) => option.id === selectedOptionId) ?? null;

  if (!correctOption) {
    return (
      <AnswerList
        options={item.options}
        selectedOptionId={selectedOptionId}
        correctOptionId={null}
        hiddenOptionId={null}
        isLocked
        onSelect={() => {}}
      />
    );
  }

  const secondaryOptions = item.options.filter((option) => {
    if (selectedOption && option.id === selectedOption.id) {
      return false;
    }

    return option.id !== correctOption.id;
  });

  return (
    <div className="space-y-2.5">
      {selectedOption && selectedOption.id !== correctOption.id ? (
        <>
          <AnswerOption option={selectedOption} state="wrong" onSelect={() => {}} />
          <AnswerOption option={correctOption} state="revealed_correct" onSelect={() => {}} />
        </>
      ) : (
        <AnswerOption option={correctOption} state="correct" onSelect={() => {}} />
      )}

      {secondaryOptions.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {secondaryOptions.map((option) => (
            <div
              key={option.id}
              className="rounded-2xl border border-white/10 bg-white/[0.018] px-3 py-4 text-center opacity-65"
            >
              <div className="mx-auto inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md border border-indigo-300/16 bg-indigo-500/[0.08] px-2 text-xs font-semibold text-indigo-100">
                {option.label}
              </div>
              <p className="mt-3 text-[0.95rem] leading-6 text-white/88">{option.text}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}


type PersistedQuizProgress = {
  version: 1;
  currentQuestionIndex: number;
  answers: Record<string, LocalAnswerState>;
  draftSelections: Record<string, string>;
  hintVisibleMap: Record<string, boolean>;
  hintUsedMap: Record<string, boolean>;
  fiftyFiftyUsedMap: Record<string, boolean>;
  hiddenOptionMap: Record<string, string | null>;
  reviewModeActive: boolean;
  updatedAt: string;
};

const QUIZ_ONBOARDING_STEPS: QuizOnboardingStep[] = [
  {
    target: "question-area",
    title: "Rozwiązuj pytania krok po kroku",
    body: "Po każdej odpowiedzi od razu zobaczysz feedback.",
  },
  {
    target: "hint-action",
    title: "Potrzebujesz podpowiedzi?",
    body: "Wskazówka naprowadzi Cię, na co zwrócić uwagę - bez zdradzania odpowiedzi.",
  },
  {
    target: "fifty-action",
    title: "Utknęłaś? Użyj 50/50",
    body: "Usunie jedną błędną odpowiedź i pomoże ruszyć dalej.",
  },
];

type HalftoneVariant = "quiz" | "results";

function QuizHalftoneBackground({ variant }: { variant: HalftoneVariant }) {
  const isResults = variant === "results";
  const dotColorPrimary = isResults ? "rgba(167, 139, 250, 0.34)" : "rgba(129, 140, 248, 0.16)";
  const dotColorSecondary = isResults ? "rgba(125, 211, 252, 0.24)" : "rgba(125, 211, 252, 0.12)";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-x-[-10%] bottom-[-28%] h-[66%]"
        style={{
          background: isResults
            ? "radial-gradient(120% 95% at 50% 100%, rgba(99,102,241,0.20) 0%, rgba(59,130,246,0.11) 34%, rgba(5,5,16,0) 74%)"
            : "radial-gradient(120% 95% at 50% 100%, rgba(99,102,241,0.11) 0%, rgba(59,130,246,0.06) 34%, rgba(5,5,16,0) 74%)",
        }}
      />

      <div
        className="absolute inset-x-[-12%] bottom-[-10%] h-[68%]"
        style={{
          backgroundImage: `radial-gradient(circle, ${dotColorPrimary} 1.1px, transparent 1.55px)`,
          backgroundSize: isResults ? "11px 11px" : "13px 13px",
          backgroundPosition: "50% 100%",
          opacity: isResults ? 0.44 : 0.24,
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0) 86%)",
          maskImage: "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0) 86%)",
        }}
      />

      <div
        className="absolute right-[-18%] bottom-[-16%] h-[60%] w-[62%]"
        style={{
          backgroundImage: `radial-gradient(circle, ${dotColorSecondary} 1.2px, transparent 1.7px)`,
          backgroundSize: isResults ? "13px 13px" : "15px 15px",
          backgroundPosition: "right bottom",
          opacity: isResults ? 0.34 : 0.18,
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 52%, rgba(0,0,0,0) 88%)",
          maskImage: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 52%, rgba(0,0,0,0) 88%)",
        }}
      />
    </div>
  );
}

const RESULTS_BACKGROUND_ICONS = [
  { Icon: Sparkles, className: "left-[8%] top-[18%] h-5 w-5 rotate-[-8deg] text-indigo-200/[0.07] blur-[1.6px]" },
  { Icon: Languages, className: "right-[12%] top-[16%] h-5 w-5 rotate-[10deg] text-sky-100/[0.07] blur-[1.6px]" },
  { Icon: BookOpen, className: "left-[14%] top-[34%] h-6 w-6 rotate-[-10deg] text-white/[0.07] blur-[1.8px]" },
  { Icon: CheckCheck, className: "right-[16%] top-[33%] h-5 w-5 rotate-[8deg] text-emerald-200/[0.07] blur-[1.6px]" },
  { Icon: Brain, className: "left-[9%] top-[56%] h-6 w-6 rotate-[-6deg] text-indigo-100/[0.07] blur-[1.8px]" },
  { Icon: Sparkles, className: "right-[10%] top-[58%] h-4 w-4 rotate-[14deg] text-amber-100/[0.07] blur-[1.4px]" },
  { Icon: Languages, className: "left-[18%] bottom-[16%] h-5 w-5 rotate-[6deg] text-white/[0.07] blur-[1.6px]" },
  { Icon: BookOpen, className: "right-[18%] bottom-[18%] h-6 w-6 rotate-[-12deg] text-indigo-100/[0.07] blur-[1.8px]" },
];

function buildSummaryFromLocal(questions: QuizQuestion[], answers: Record<string, LocalAnswerState>): QuizSummary {
  const totalQuestions = questions.reduce((sum, question) => sum + getAnswerableItems(question).length, 0);

  let correctAnswers = 0;
  const areaStats: Record<string, { total: number; correct: number }> = {};

  for (const question of questions) {
    const area = question.category || "Reakcje";
    const current = areaStats[area] ?? { total: 0, correct: 0 };
    const items = getAnswerableItems(question);
    current.total += items.length;

    for (const item of items) {
      const answer = answers[item.id];

      if (answer?.isCorrect) {
        correctAnswers += 1;
        current.correct += 1;
      }
    }

    areaStats[area] = current;
  }

  const rankedAreas = Object.entries(areaStats)
    .map(([area, stats]) => ({
      area,
      ratio: stats.total > 0 ? stats.correct / stats.total : 0,
      total: stats.total,
    }))
    .sort((a, b) => b.ratio - a.ratio);

  const categoryBreakdown = Object.entries(areaStats).map(([label, stats]) => ({
    label,
    attempts: stats.total,
    correct: stats.correct,
    percent: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null,
    has_data: stats.total > 0,
  }));

  return {
    totalQuestions,
    correctAnswers,
    scorePercent: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    strongestArea: rankedAreas[0]?.area,
    weakestArea: rankedAreas[rankedAreas.length - 1]?.area,
    categoryBreakdown,
  };
}

function readActiveSessions(): ActiveQuizSessionMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(QUIZ_ACTIVE_SESSION_STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as ActiveQuizSessionMap;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeActiveSessions(value: ActiveQuizSessionMap) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(QUIZ_ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

function normalizeSetId(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseCount(value: string | undefined): number | undefined {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.max(5, Math.min(10, Math.round(parsed)));
}

function normalizeModes(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index);
}

function normalizeFocus(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeFocusSource(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "grammar" || normalized === "vocabulary" || normalized === "skill" ? normalized : undefined;
}

function buildSessionContextKey(
  mode: string,
  setId: string | undefined,
  count: number | undefined,
  modes: string[],
  focus: string | undefined,
  focusSource: string | undefined,
) {
  const modeKey = modes.length > 0 ? modes.join(",") : mode;
  const countKey = count ?? 10;
  const focusKey = focus ? `:focus:${focus.toLowerCase()}` : "";
  const focusSourceKey = focusSource ? `:focus-source:${focusSource}` : "";
  return setId ? `set:${setId}:count:${countKey}${focusSourceKey}${focusKey}` : `mode:${modeKey}:count:${countKey}${focusSourceKey}${focusKey}`;
}

export function QuizScreen({
  sessionId,
  initialMode,
  initialReviewMode = false,
  initialSetId,
  initialCount,
  initialModes,
  initialFocus,
  initialFocusSource,
  initialFocusRaw,
}: QuizScreenProps) {
  const [mode, setMode] = useState(initialMode);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, LocalAnswerState>>({});
  const [draftSelections, setDraftSelections] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedSaveCount, setFailedSaveCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerStoppedAfterLastAnswer, setIsTimerStoppedAfterLastAnswer] = useState(false);
  const [hasStartedQuizInteraction, setHasStartedQuizInteraction] = useState(false);
  const [hintVisibleMap, setHintVisibleMap] = useState<Record<string, boolean>>({});
  const [hintUsedMap, setHintUsedMap] = useState<Record<string, boolean>>({});
  const [fiftyFiftyUsedMap, setFiftyFiftyUsedMap] = useState<Record<string, boolean>>({});
  const [hiddenOptionMap, setHiddenOptionMap] = useState<Record<string, string | null>>({});
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState<boolean | null>(null);
  const [reviewModeActive, setReviewModeActive] = useState(initialReviewMode);
  const [isCompletedSession, setIsCompletedSession] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [taskValidationMessage, setTaskValidationMessage] = useState<string | null>(null);
  const [translatedPassageMap, setTranslatedPassageMap] = useState<Record<string, boolean>>({});

  const answersRef = useRef<Record<string, LocalAnswerState>>({});
  const failedSavesRef = useRef<Record<string, SaveAnswerPayload>>({});
  const inFlightSavesRef = useRef<Record<string, boolean>>({});
  const didCompleteRef = useRef(false);
  const onboardingCheckedRef = useRef(false);
  const hasSoundInteractionRef = useRef(false);
  const completionSoundPlayedRef = useRef(false);
  const shouldPlayCompletionSoundRef = useRef(false);
  const feedbackSoundTimeoutRef = useRef<number | null>(null);

  const progressStorageKey = useMemo(() => getProgressStorageKey(sessionId), [sessionId]);
  const normalizedSetId = useMemo(() => normalizeSetId(initialSetId), [initialSetId]);
  const requestedCount = useMemo(() => parseCount(initialCount), [initialCount]);
  const normalizedRequestedModes = useMemo(() => normalizeModes(initialModes), [initialModes]);
  const normalizedFocus = useMemo(() => normalizeFocus(initialFocus), [initialFocus]);
  const normalizedFocusSource = useMemo(() => normalizeFocusSource(initialFocusSource), [initialFocusSource]);
  const normalizedFocusRaw = useMemo(() => normalizeFocus(initialFocusRaw), [initialFocusRaw]);
  const activeSessionStorageKey = useMemo(
    () => buildSessionContextKey(initialMode, normalizedSetId, requestedCount, normalizedRequestedModes, normalizedFocusRaw ?? normalizedFocus, normalizedFocusSource),
    [initialMode, normalizedFocus, normalizedFocusRaw, normalizedFocusSource, normalizedRequestedModes, normalizedSetId, requestedCount],
  );

  const registerSoundInteraction = useCallback(() => {
    if (hasSoundInteractionRef.current) {
      return;
    }

    hasSoundInteractionRef.current = true;
    quizSoundManager.unlock();
  }, []);

  const playFeedbackSound = useCallback((isCorrect: boolean) => {
    if (feedbackSoundTimeoutRef.current !== null) {
      window.clearTimeout(feedbackSoundTimeoutRef.current);
      feedbackSoundTimeoutRef.current = null;
    }

    feedbackSoundTimeoutRef.current = window.setTimeout(() => {
      quizSoundManager.play(isCorrect ? "success" : "error", { minIntervalMs: 120 });
      feedbackSoundTimeoutRef.current = null;
    }, 95);
  }, []);

  const playClickSound = useCallback(() => {
    quizSoundManager.play("click", { minIntervalMs: 70 });
  }, []);
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const readPersistedProgress = useCallback((nextQuestions: QuizQuestion[]): PersistedQuizProgress | null => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(progressStorageKey);

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<PersistedQuizProgress>;

      if (parsed.version !== 1) {
        return null;
      }

      const questionById = new Map(nextQuestions.map((question) => [question.id, question]));
      const answerableItems = getAnswerableItemsMap(nextQuestions);
      const sanitizedAnswers: Record<string, LocalAnswerState> = {};
      const sanitizedDraftSelections: Record<string, string> = {};

      const rawAnswers = parsed.answers ?? {};

      for (const [questionId, answer] of Object.entries(rawAnswers)) {
        const item = answerableItems.get(questionId);

        if (!item || !answer || typeof answer !== "object") {
          continue;
        }

        const selectedOptionId = typeof answer.selectedOptionId === "string" ? answer.selectedOptionId : "";

        if (!selectedOptionId || !item.options.some((option) => option.id === selectedOptionId)) {
          continue;
        }

        const saveState = answer.saveState === "pending" || answer.saveState === "error" || answer.saveState === "saved" ? answer.saveState : "saved";

        sanitizedAnswers[questionId] = {
          questionId,
          selectedOptionId,
          isCorrect: Boolean(answer.isCorrect),
          saveState,
        };
      }

      for (const [questionId, selectedOptionId] of Object.entries(parsed.draftSelections ?? {})) {
        const item = answerableItems.get(questionId);

        if (!item || typeof selectedOptionId !== "string") {
          continue;
        }

        if (!item.options.some((option) => option.id === selectedOptionId)) {
          continue;
        }

        sanitizedDraftSelections[questionId] = selectedOptionId;
      }

      const sanitizeBooleanMap = (map: Record<string, unknown> | undefined) => {
        const next: Record<string, boolean> = {};

        for (const [questionId, value] of Object.entries(map ?? {})) {
          if (questionById.has(questionId) && value === true) {
            next[questionId] = true;
          }
        }

        return next;
      };

      const sanitizedHintVisibleMap = sanitizeBooleanMap(parsed.hintVisibleMap as Record<string, unknown> | undefined);
      const sanitizedHintUsedMap = sanitizeBooleanMap(parsed.hintUsedMap as Record<string, unknown> | undefined);
      const sanitizedFiftyMap = sanitizeBooleanMap(parsed.fiftyFiftyUsedMap as Record<string, unknown> | undefined);

      const sanitizedHiddenMap: Record<string, string | null> = {};

      for (const [questionId, value] of Object.entries((parsed.hiddenOptionMap ?? {}) as Record<string, unknown>)) {
        const question = questionById.get(questionId);

        if (!question || question.type !== "single_question") {
          continue;
        }

        if (typeof value !== "string") {
          continue;
        }

        const option = question.options.find((entry) => entry.id === value);

        if (!option || option.isCorrect) {
          continue;
        }

        sanitizedHiddenMap[questionId] = value;
      }

      const safeIndex = Number.isFinite(parsed.currentQuestionIndex)
        ? Math.max(0, Math.min(nextQuestions.length - 1, Number(parsed.currentQuestionIndex)))
        : 0;

      return {
        version: 1,
        currentQuestionIndex: safeIndex,
        answers: sanitizedAnswers,
        draftSelections: sanitizedDraftSelections,
        hintVisibleMap: sanitizedHintVisibleMap,
        hintUsedMap: sanitizedHintUsedMap,
        fiftyFiftyUsedMap: sanitizedFiftyMap,
        hiddenOptionMap: sanitizedHiddenMap,
        reviewModeActive: Boolean(parsed.reviewModeActive),
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }, [progressStorageKey]);

  const persistClientProgress = useCallback((payload: PersistedQuizProgress) => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(progressStorageKey, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [progressStorageKey]);


  const syncActiveSessionMarker = useCallback(
    (status: "in_progress" | "completed") => {
      const activeSessions = readActiveSessions();

      if (status === "completed") {
        if (activeSessions[activeSessionStorageKey]?.sessionId === sessionId) {
          delete activeSessions[activeSessionStorageKey];
          writeActiveSessions(activeSessions);
        }

        return;
      }

      activeSessions[activeSessionStorageKey] = {
        sessionId,
        updatedAt: new Date().toISOString(),
      };

      writeActiveSessions(activeSessions);
    },
    [activeSessionStorageKey, sessionId],
  );
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const totalQuestions = questions.length;
  const safeCurrent = totalQuestions > 0 ? currentQuestionIndex + 1 : 0;
  const currentItems = useMemo(() => getAnswerableItems(currentQuestion), [currentQuestion]);
  const currentTaskResult = useMemo(() => getQuestionResult(currentQuestion, answers), [answers, currentQuestion]);
  const currentTaskAnswered = useMemo(() => isQuestionFullyAnswered(currentQuestion, answers), [answers, currentQuestion]);
  const currentQuestionPassed = currentTaskResult.total > 0 && currentTaskResult.correct === currentTaskResult.total;
  const currentQuestionSaveStates = currentItems
    .map((item) => answers[item.id]?.saveState)
    .filter((value): value is LocalAnswerState["saveState"] => Boolean(value));
  const currentQuestionSaveState =
    currentQuestionSaveStates.includes("error")
      ? "error"
      : currentQuestionSaveStates.includes("pending")
        ? "pending"
        : currentQuestionSaveStates.length > 0
          ? "saved"
          : null;

  const correctOptionId = useMemo(
    () => (currentQuestion?.type === "single_question" ? currentQuestion.options.find((option) => option.isCorrect)?.id ?? null : null),
    [currentQuestion],
  );

  const currentAnswer = currentQuestion?.type === "single_question" ? answers[currentQuestion.id] : undefined;
  const currentHintVisible = currentQuestion ? Boolean(hintVisibleMap[currentQuestion.id]) : false;
  const currentHintUsed = currentQuestion ? Boolean(hintUsedMap[currentQuestion.id]) : false;
  const currentFiftyFiftyUsed = currentQuestion ? Boolean(fiftyFiftyUsedMap[currentQuestion.id]) : false;
  const currentHiddenOptionId = currentQuestion ? hiddenOptionMap[currentQuestion.id] ?? null : null;
  const currentHintText = useMemo(() => resolveHintText(currentQuestion), [currentQuestion]);
  const showTranslatedPassage =
    currentQuestion !== null &&
    currentQuestion.type !== "single_question" &&
    Boolean(currentQuestion.passageTranslation) &&
    translatedPassageMap[currentQuestion.id] === true;
  const currentDisplayedPassage =
    currentQuestion && currentQuestion.type !== "single_question"
      ? showTranslatedPassage && currentQuestion.passageTranslation
        ? currentQuestion.passageTranslation
        : currentQuestion.passage
      : null;
  const alternateDisplayedPassage =
    currentQuestion && currentQuestion.type !== "single_question" && currentQuestion.passageTranslation
      ? showTranslatedPassage
        ? currentQuestion.passage
        : currentQuestion.passageTranslation
      : null;

  const summary = useMemo(() => {
    return buildSummaryFromLocal(questions, answers);
  }, [answers, questions]);


  const maxReachableIndex = useMemo(() => {
    if (!questions.length) {
      return 0;
    }

    const firstUnanswered = questions.findIndex((question) => !isQuestionFullyAnswered(question, answers));
    return firstUnanswered === -1 ? questions.length - 1 : firstUnanswered;
  }, [answers, questions]);

  const pendingSaveCount = useMemo(
    () => Object.values(answers).filter((answer) => answer.saveState === "pending").length,
    [answers],
  );
  const questionStatuses = useMemo<QuestionStatus[]>(() => {
    return questions.map((question, index) => {
      if (index === currentQuestionIndex) {
        return "current";
      }

      if (!isQuestionFullyAnswered(question, answers)) {
        return "idle";
      }

      const result = getQuestionResult(question, answers);
      return result.total > 0 && result.correct === result.total ? "correct" : "wrong";
    });
  }, [answers, currentQuestionIndex, questions]);

  const syncQuestionState = useCallback(
    (rawIndex: number) => {
      if (!questions.length) {
        return;
      }

      const boundedIndex = Math.max(0, Math.min(questions.length - 1, rawIndex));
      const nextQuestion = questions[boundedIndex];
      const nextItems = getAnswerableItems(nextQuestion);
      const existingAnswer = nextItems[0] ? answersRef.current[nextItems[0].id] : undefined;
      const fullyAnswered = isQuestionFullyAnswered(nextQuestion, answersRef.current);
      const result = getQuestionResult(nextQuestion, answersRef.current);

      setCurrentQuestionIndex(boundedIndex);
      setTaskValidationMessage(null);

      if (fullyAnswered) {
        setSelectedOptionId(existingAnswer?.selectedOptionId ?? null);
        setIsLocked(true);
        setSessionStatus(result.total > 0 && result.correct === result.total ? "answered_correct" : "answered_incorrect");
        return;
      }

      setSelectedOptionId(nextItems[0] ? draftSelections[nextItems[0].id] ?? null : null);
      setIsLocked(false);
      setSessionStatus("idle");
    },
    [draftSelections, questions],
  );

  const markSaveState = useCallback((questionId: string, saveState: LocalAnswerState["saveState"]) => {
    setAnswers((prev) => {
      const previous = prev[questionId];

      if (!previous) {
        return prev;
      }

      const next = {
        ...prev,
        [questionId]: {
          ...previous,
          saveState,
        },
      };

      answersRef.current = next;
      return next;
    });
  }, []);

  const getAuthHeaders = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      return token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : {};
    } catch {
      return {};
    }
  }, []);

  const saveAnswerInBackground = useCallback(
    (payload: SaveAnswerPayload) => {
      if (inFlightSavesRef.current[payload.questionId]) {
        return;
      }

      inFlightSavesRef.current[payload.questionId] = true;
      markSaveState(payload.questionId, "pending");

      void (async () => {
        try {
          const authHeaders = await getAuthHeaders();

          const response = await fetch(`/api/e8/quiz/session/${encodeURIComponent(sessionId)}/answers`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            if (response.status === 400) {
              delete failedSavesRef.current[payload.questionId];
              markSaveState(payload.questionId, "error");
              setFailedSaveCount(Object.keys(failedSavesRef.current).length);
              return;
            }

            throw new Error("save_failed");
          }

          markSaveState(payload.questionId, "saved");
          delete failedSavesRef.current[payload.questionId];
          setFailedSaveCount(Object.keys(failedSavesRef.current).length);
        } catch {
          failedSavesRef.current[payload.questionId] = payload;
          markSaveState(payload.questionId, "error");
          setFailedSaveCount(Object.keys(failedSavesRef.current).length);
        } finally {
          delete inFlightSavesRef.current[payload.questionId];
        }
      })();
    },
    [getAuthHeaders, markSaveState, sessionId],
  );

  const flushFailedSaves = useCallback(() => {
    const pending = Object.values(failedSavesRef.current);

    if (pending.length === 0) {
      return;
    }

    for (const item of pending) {
      saveAnswerInBackground(item);
    }
  }, [saveAnswerInBackground]);

  const completeSessionSync = useCallback(
    (summaryPayload: QuizSummary) => {
      if (didCompleteRef.current) {
        return;
      }

      didCompleteRef.current = true;

      void (async () => {
        try {
          // Keep retrying queued answer saves before completing.
          // The /complete route recomputes score from DB, so pending saves must settle first.
          const deadline = Date.now() + 6000;
          while (
            (Object.keys(inFlightSavesRef.current).length > 0 || Object.keys(failedSavesRef.current).length > 0) &&
            Date.now() < deadline
          ) {
            if (Object.keys(failedSavesRef.current).length > 0) {
              flushFailedSaves();
            }

            await new Promise<void>((resolve) => window.setTimeout(resolve, 80));
          }

          if (Object.keys(inFlightSavesRef.current).length > 0 || Object.keys(failedSavesRef.current).length > 0) {
            didCompleteRef.current = false;
            return;
          }

          const authHeaders = await getAuthHeaders();

          await fetch(`/api/e8/quiz/session/${encodeURIComponent(sessionId)}/complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({
              summary: summaryPayload,
              mode,
              setId: normalizedSetId,
            }),
          });
        } catch {
          didCompleteRef.current = false;
          // Keep local completion state even if sync fails.
        }
      })();
    },
    [flushFailedSaves, getAuthHeaders, mode, normalizedSetId, sessionId],
  );

  const hydrateSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setElapsedSeconds(0);
    setIsTimerStoppedAfterLastAnswer(false);
    setHasStartedQuizInteraction(false);
    setDraftSelections({});
    setTaskValidationMessage(null);
    setReviewModeActive(initialReviewMode);
    setIsCompletedSession(false);
    completionSoundPlayedRef.current = false;
    shouldPlayCompletionSoundRef.current = false;
    hasSoundInteractionRef.current = false;
    onboardingCheckedRef.current = false;

    try {
      const authHeaders = await getAuthHeaders();

      const query = new URLSearchParams({ mode: initialMode });

      if (typeof requestedCount === "number") {
        query.set("count", String(requestedCount));
      }

      if (normalizedSetId) {
        query.set("set", normalizedSetId);
      } else if (normalizedRequestedModes.length > 1) {
        query.set("modes", normalizedRequestedModes.join(","));
      }

      if (normalizedFocus) {
        query.set("focus", normalizedFocus);
      }

      if (normalizedFocusSource) {
        query.set("focusSource", normalizedFocusSource);
      }

      if (normalizedFocusRaw) {
        query.set("focusRaw", normalizedFocusRaw);
      }

      const response = await fetch(
        `/api/e8/quiz/session/${encodeURIComponent(sessionId)}?${query.toString()}`,
        {
          cache: "no-store",
          headers: {
            ...authHeaders,
          },
        },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        details?: string;
      } & Partial<QuizSessionPayload>;

      if (!response.ok) {
        const message = typeof payload.error === "string" && payload.error.trim().length > 0
          ? payload.details && payload.details.trim().length > 0
            ? `${payload.error} ${payload.details}`
            : payload.error
          : "Nie uda\u0142o si\u0119 pobra\u0107 pyta\u0144.";

        if (typeof payload.details === "string" && payload.details.trim().length > 0) {
          console.warn("Quiz hydrate details:", payload.details);
        }

        throw new Error(message);
      }

      const data = payload as QuizSessionPayload;

      if (!data.questions?.length) {
        throw new Error("Brak pytan dla tego testu w bazie danych.");
      }

      setMode(typeof data.mode === "string" ? data.mode : initialMode);
      setQuestions(data.questions);

      const answerableItems = getAnswerableItemsMap(data.questions);
      const persistedProgress = readPersistedProgress(data.questions);
      const hydratedAnswers: Record<string, LocalAnswerState> = {};
      const answerList = Array.isArray(data.answers) ? data.answers : [];

      for (const answer of answerList) {
        const item = answerableItems.get(answer.questionId);

        if (!item) {
          continue;
        }

        if (!item.options.some((option) => option.id === answer.selectedOptionId)) {
          continue;
        }

        hydratedAnswers[answer.questionId] = {
          ...answer,
          saveState: "saved",
        };
      }

      const mergedAnswers: Record<string, LocalAnswerState> = {
        ...hydratedAnswers,
      };

      for (const [questionId, persistedAnswer] of Object.entries(persistedProgress?.answers ?? {})) {
        const serverAnswer = hydratedAnswers[questionId];

        if (!serverAnswer) {
          mergedAnswers[questionId] = persistedAnswer;
          continue;
        }

        if (serverAnswer.selectedOptionId === persistedAnswer.selectedOptionId) {
          mergedAnswers[questionId] = serverAnswer;
          continue;
        }

        mergedAnswers[questionId] = persistedAnswer;
      }

      answersRef.current = mergedAnswers;
      setAnswers(mergedAnswers);
      setDraftSelections(persistedProgress?.draftSelections ?? {});

      const restoredHintVisible = persistedProgress?.hintVisibleMap ?? {};
      const restoredHintUsed = persistedProgress?.hintUsedMap ?? {};
      const restoredFiftyUsed = persistedProgress?.fiftyFiftyUsedMap ?? {};
      const restoredHiddenOptionMap = persistedProgress?.hiddenOptionMap ?? {};

      setHintVisibleMap(restoredHintVisible);
      setHintUsedMap(restoredHintUsed);
      setFiftyFiftyUsedMap(restoredFiftyUsed);
      setHiddenOptionMap(restoredHiddenOptionMap);

      const queuedFailedSaves: Record<string, SaveAnswerPayload> = {};

      for (const [questionId, answer] of Object.entries(mergedAnswers)) {
        if (answer.saveState === "saved") {
          continue;
        }

        queuedFailedSaves[questionId] = {
          questionId,
          optionId: answer.selectedOptionId,
          isCorrect: answer.isCorrect,
        };
      }

      failedSavesRef.current = queuedFailedSaves;
      inFlightSavesRef.current = {};
      setFailedSaveCount(Object.keys(queuedFailedSaves).length);

      const allAnswered = data.questions.every((question) => isQuestionFullyAnswered(question, mergedAnswers));
      const completedFromPayload = data.status === "completed" || allAnswered;
      const shouldStartInReview = initialReviewMode || Boolean(persistedProgress?.reviewModeActive);

      setIsCompletedSession(completedFromPayload);
      setReviewModeActive(shouldStartInReview);

      let targetIndex = 0;

      if (shouldStartInReview) {
        targetIndex = persistedProgress?.currentQuestionIndex ?? 0;
      } else if (completedFromPayload) {
        targetIndex = Math.max(data.questions.length - 1, 0);
      } else {
        const firstUnansweredIndex = data.questions.findIndex((question) => !isQuestionFullyAnswered(question, mergedAnswers));
        const fallbackIndex = firstUnansweredIndex === -1 ? Math.max(data.questions.length - 1, 0) : firstUnansweredIndex;

        if (persistedProgress) {
          targetIndex = Math.min(persistedProgress.currentQuestionIndex, fallbackIndex);
        } else {
          targetIndex = fallbackIndex;
        }
      }

      targetIndex = Math.max(0, Math.min(data.questions.length - 1, targetIndex));

      const targetQuestion = data.questions[targetIndex];
      const targetItems = getAnswerableItems(targetQuestion);
      const targetAnswer = targetItems[0] ? mergedAnswers[targetItems[0].id] : undefined;
      const targetAnswered = targetQuestion ? isQuestionFullyAnswered(targetQuestion, mergedAnswers) : false;
      const targetResult = targetQuestion ? getQuestionResult(targetQuestion, mergedAnswers) : { correct: 0, total: 0 };

      setCurrentQuestionIndex(targetIndex);
      setTaskValidationMessage(null);

      if (completedFromPayload && !shouldStartInReview) {
        setSelectedOptionId(targetAnswer?.selectedOptionId ?? null);
        setIsLocked(targetAnswered);
        setSessionStatus("finished");
        didCompleteRef.current = true;
      } else if (targetAnswered) {
        setSelectedOptionId(targetAnswer?.selectedOptionId ?? null);
        setIsLocked(true);
        setSessionStatus(targetResult.total > 0 && targetResult.correct === targetResult.total ? "answered_correct" : "answered_incorrect");
        didCompleteRef.current = false;
      } else {
        setSelectedOptionId(null);
        setIsLocked(false);
        setSessionStatus("idle");
        didCompleteRef.current = false;
      }

      const hasAnyInteraction =
        Object.keys(mergedAnswers).length > 0 ||
        Object.keys(persistedProgress?.draftSelections ?? {}).length > 0 ||
        Object.keys(restoredHintUsed).length > 0 ||
        Object.keys(restoredFiftyUsed).length > 0;

      setHasStartedQuizInteraction(hasAnyInteraction);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Wystapil blad ladowania.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [
    getAuthHeaders,
    initialMode,
    initialReviewMode,
    normalizedRequestedModes,
    normalizedFocus,
    normalizedFocusRaw,
    normalizedFocusSource,
    normalizedSetId,
    readPersistedProgress,
    requestedCount,
    sessionId,
  ]);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      setSoundEnabled(window.localStorage.getItem(QUIZ_SOUND_MUTED_STORAGE_KEY) !== "1");
    } catch {
      setSoundEnabled(true);
    }
  }, []);

  useEffect(() => {
    quizSoundManager.setEnabled(soundEnabled);

    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(QUIZ_SOUND_MUTED_STORAGE_KEY, soundEnabled ? "0" : "1");
    } catch {
      // ignore storage errors
    }
  }, [soundEnabled]);

  useEffect(() => {
    return () => {
      if (feedbackSoundTimeoutRef.current !== null) {
        window.clearTimeout(feedbackSoundTimeoutRef.current);
        feedbackSoundTimeoutRef.current = null;
      }

      quizSoundManager.stopAll();
    };
  }, []);

  useEffect(() => {
    if (isLoading || !questions.length) {
      return;
    }

    persistClientProgress({
      version: 1,
      currentQuestionIndex,
      answers,
      draftSelections,
      hintVisibleMap,
      hintUsedMap,
      fiftyFiftyUsedMap,
      hiddenOptionMap,
      reviewModeActive,
      updatedAt: new Date().toISOString(),
    });
  }, [
    answers,
    currentQuestionIndex,
    draftSelections,
    fiftyFiftyUsedMap,
    hiddenOptionMap,
    hintUsedMap,
    hintVisibleMap,
    isLoading,
    persistClientProgress,
    questions.length,
    reviewModeActive,
  ]);

  useEffect(() => {
    if (isLoading || !mode) {
      return;
    }

    if (isCompletedSession || sessionStatus === "finished") {
      syncActiveSessionMarker("completed");
      return;
    }

    syncActiveSessionMarker("in_progress");
  }, [isCompletedSession, isLoading, mode, sessionStatus, syncActiveSessionMarker]);

  useEffect(() => {
    if (isLoading || failedSaveCount === 0) {
      return;
    }

    const delayedFlush = window.setTimeout(() => {
      flushFailedSaves();
    }, 350);

    return () => {
      window.clearTimeout(delayedFlush);
    };
  }, [failedSaveCount, flushFailedSaves, isLoading]);

  useEffect(() => {
    if (failedSaveCount === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      flushFailedSaves();
    }, 12000);

    const onFocus = () => {
      flushFailedSaves();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        flushFailedSaves();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [failedSaveCount, flushFailedSaves]);

  useEffect(() => {
    if (isLoading || reviewModeActive || sessionStatus !== "finished" || failedSaveCount > 0 || didCompleteRef.current) {
      return;
    }

    completeSessionSync(summary);
  }, [completeSessionSync, failedSaveCount, isLoading, reviewModeActive, sessionStatus, summary]);

  useEffect(() => {
    if (
      isLoading ||
      sessionStatus === "finished" ||
      reviewModeActive ||
      onboardingVisible ||
      !hasStartedQuizInteraction ||
      isTimerStoppedAfterLastAnswer
    ) {
      return;
    }

    const timerId = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [hasStartedQuizInteraction, isLoading, isTimerStoppedAfterLastAnswer, onboardingVisible, reviewModeActive, sessionStatus]);

  useEffect(() => {
    if (isLoading || sessionStatus === "finished" || reviewModeActive || isCompletedSession || onboardingCheckedRef.current) {
      return;
    }

    onboardingCheckedRef.current = true;
    let isMounted = true;

    const checkOnboardingVisibility = async () => {
      let authenticated = false;

      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        authenticated = Boolean(data.session?.user);
      } catch {
        authenticated = false;
      }

      if (!isMounted) {
        return;
      }

      setIsAuthenticatedUser(authenticated);

      try {
        const hasSeen = authenticated
          ? window.localStorage.getItem(QUIZ_ONBOARDING_STORAGE_KEY) === "1"
          : window.sessionStorage.getItem(QUIZ_ONBOARDING_SESSION_STORAGE_KEY) === "1";

        if (!hasSeen) {
          setOnboardingVisible(true);
          setOnboardingStep(0);
        }
      } catch {
        setOnboardingVisible(true);
        setOnboardingStep(0);
      }
    };

    void checkOnboardingVisibility();

    return () => {
      isMounted = false;
    };
  }, [isCompletedSession, isLoading, reviewModeActive, sessionStatus]);

  useEffect(() => {
    const onOnline = () => {
      flushFailedSaves();
    };

    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
    };
  }, [flushFailedSaves]);

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion || currentQuestion.type !== "single_question" || isLocked || reviewModeActive) {
      return;
    }

    if (hiddenOptionMap[currentQuestion.id] === optionId) {
      return;
    }

    if (answersRef.current[currentQuestion.id]) {
      return;
    }

    setHasStartedQuizInteraction(true);
    setSelectedOptionId(optionId);
    setTaskValidationMessage(null);
    setDraftSelections((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleCheckSingleQuestion = () => {
    if (!currentQuestion || currentQuestion.type !== "single_question" || isLocked || reviewModeActive) {
      return;
    }

    const optionId = selectedOptionId ?? draftSelections[currentQuestion.id] ?? null;

    if (!optionId) {
      setTaskValidationMessage("Zaznacz odpowiedź, aby sprawdzić to pytanie.");
      return;
    }

    const chosenOption = currentQuestion.options.find((option) => option.id === optionId);

    if (!chosenOption) {
      return;
    }

    registerSoundInteraction();
    playClickSound();
    playFeedbackSound(chosenOption.isCorrect);
    setTaskValidationMessage(null);

    const localAnswer: LocalAnswerState = {
      questionId: currentQuestion.id,
      selectedOptionId: optionId,
      isCorrect: chosenOption.isCorrect,
      saveState: "pending",
    };

    const savePayload: SaveAnswerPayload = {
      questionId: currentQuestion.id,
      optionId,
      isCorrect: chosenOption.isCorrect,
    };

    setHasStartedQuizInteraction(true);
    setSelectedOptionId(optionId);
    setIsLocked(true);
    setSessionStatus(chosenOption.isCorrect ? "answered_correct" : "answered_incorrect");
    setIsTimerStoppedAfterLastAnswer(currentQuestionIndex >= totalQuestions - 1);
    setAnswers((prev) => {
      const next = {
        ...prev,
        [currentQuestion.id]: localAnswer,
      };

      answersRef.current = next;
      return next;
    });

    failedSavesRef.current[currentQuestion.id] = savePayload;
    setFailedSaveCount(Object.keys(failedSavesRef.current).length);
    saveAnswerInBackground(savePayload);
  };

  const handleSelectGroupedOption = (itemId: string, optionId: string) => {
    if (!currentQuestion || currentQuestion.type === "single_question" || isLocked || reviewModeActive) {
      return;
    }

    const item = currentItems.find((entry) => entry.id === itemId);

    if (!item) {
      return;
    }

    if (!item.options.some((option) => option.id === optionId)) {
      return;
    }

    registerSoundInteraction();
    playClickSound();
    setHasStartedQuizInteraction(true);
    setTaskValidationMessage(null);

    setDraftSelections((prev) => ({
      ...prev,
      [itemId]: optionId,
    }));
  };

  const handleCheckGroupedQuestion = () => {
    if (!currentQuestion || currentQuestion.type === "single_question" || isLocked || reviewModeActive) {
      return;
    }

    const missingItems = currentItems.filter((item) => !draftSelections[item.id]);

    if (missingItems.length > 0) {
      setTaskValidationMessage("Zaznacz odpowiedź przy każdym podpunkcie.");
      return;
    }

    registerSoundInteraction();
    playClickSound();
    setHasStartedQuizInteraction(true);
    setTaskValidationMessage(null);

    const nextAnswers: Record<string, LocalAnswerState> = { ...answersRef.current };
    const savePayloads: SaveAnswerPayload[] = [];
    let correctCount = 0;

    for (const item of currentItems) {
      const selectedOptionId = draftSelections[item.id];
      const selectedOption = item.options.find((option) => option.id === selectedOptionId);

      if (!selectedOptionId || !selectedOption) {
        continue;
      }

      const localAnswer: LocalAnswerState = {
        questionId: item.id,
        selectedOptionId,
        isCorrect: selectedOption.isCorrect,
        saveState: "pending",
      };

      nextAnswers[item.id] = localAnswer;
      failedSavesRef.current[item.id] = {
        questionId: item.id,
        optionId: selectedOptionId,
        isCorrect: selectedOption.isCorrect,
      };
      savePayloads.push(failedSavesRef.current[item.id]);

      if (selectedOption.isCorrect) {
        correctCount += 1;
      }
    }

    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);
    setIsLocked(true);
    setSelectedOptionId(null);
    setSessionStatus(correctCount === currentItems.length ? "answered_correct" : "answered_incorrect");
    setIsTimerStoppedAfterLastAnswer(currentQuestionIndex >= totalQuestions - 1);
    setFailedSaveCount(Object.keys(failedSavesRef.current).length);

    playFeedbackSound(correctCount === currentItems.length);

    for (const payload of savePayloads) {
      saveAnswerInBackground(payload);
    }
  };

  const handleToggleHint = () => {
    if (!currentQuestion || isLocked || reviewModeActive) {
      return;
    }

    registerSoundInteraction();
    setHasStartedQuizInteraction(true);

    setHintUsedMap((prev) => ({
      ...prev,
      [currentQuestion.id]: true,
    }));

    setHintVisibleMap((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };
  const handleUseFiftyFifty = () => {
    if (!currentQuestion || currentQuestion.type !== "single_question" || isLocked || reviewModeActive || fiftyFiftyUsedMap[currentQuestion.id]) {
      return;
    }

    const visibleOptions = currentQuestion.options.slice(0, 3);
    const wrongOptions = visibleOptions.filter((option) => !option.isCorrect);

    if (!wrongOptions.length) {
      return;
    }

    registerSoundInteraction();
    playClickSound();
    setHasStartedQuizInteraction(true);

    const hiddenOption = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];

    setHiddenOptionMap((prev) => ({
      ...prev,
      [currentQuestion.id]: hiddenOption.id,
    }));

    setFiftyFiftyUsedMap((prev) => ({
      ...prev,
      [currentQuestion.id]: true,
    }));
  };
  const handleJumpToQuestion = (index: number) => {
    if (index < 0 || index >= questions.length) {
      return;
    }

    if (!reviewModeActive && index > maxReachableIndex) {
      return;
    }

    registerSoundInteraction();
    playClickSound();
    setHasStartedQuizInteraction(true);
    syncQuestionState(index);
  };

  const closeOnboarding = useCallback(() => {
    setOnboardingVisible(false);
    setOnboardingStep(0);
    registerSoundInteraction();
    setHasStartedQuizInteraction(true);

    try {
      if (isAuthenticatedUser) {
        window.localStorage.setItem(QUIZ_ONBOARDING_STORAGE_KEY, "1");
      } else {
        window.sessionStorage.setItem(QUIZ_ONBOARDING_SESSION_STORAGE_KEY, "1");
      }
    } catch {
      // ignore storage errors in private mode
    }
  }, [isAuthenticatedUser, registerSoundInteraction]);

  const handleOnboardingNext = () => {
    setOnboardingStep((prev) => {
      if (prev >= QUIZ_ONBOARDING_STEPS.length - 1) {
        closeOnboarding();
        return prev;
      }

      return prev + 1;
    });
  };

  const handleOnboardingSkip = () => {
    closeOnboarding();
  };
  const handleNext = () => {
    if (!currentQuestion) {
      return;
    }

    if (!reviewModeActive && !isLocked) {
      return;
    }

    registerSoundInteraction();
    playClickSound();

    if (currentQuestionIndex >= totalQuestions - 1) {
      shouldPlayCompletionSoundRef.current = !isCompletedSession;
      flushFailedSaves();
      setReviewModeActive(false);
      setIsCompletedSession(true);
      setSessionStatus("finished");
      completeSessionSync(summary);
      return;
    }

    setSessionStatus("loading_next");

    window.setTimeout(() => {
      syncQuestionState(currentQuestionIndex + 1);
    }, 120);
  };

  useEffect(() => {
    if (sessionStatus !== "finished" || reviewModeActive) {
      return;
    }

    if (completionSoundPlayedRef.current || !hasSoundInteractionRef.current || !shouldPlayCompletionSoundRef.current) {
      return;
    }

    completionSoundPlayedRef.current = true;
    shouldPlayCompletionSoundRef.current = false;
    quizSoundManager.play("completion", { minIntervalMs: 180 });
  }, [reviewModeActive, sessionStatus]);

  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;
  const currentTaskReadyToCheck = useMemo(() => {
    if (!currentQuestion) {
      return false;
    }

    if (currentQuestion.type === "single_question") {
      return Boolean(selectedOptionId ?? draftSelections[currentQuestion.id]);
    }

    return currentItems.length > 0 && currentItems.every((item) => Boolean(draftSelections[item.id]));
  }, [currentItems, currentQuestion, draftSelections, selectedOptionId]);

  const footerActionLabel = reviewModeActive
    ? isLastQuestion
      ? "Zobacz podsumowanie"
      : "Dalej"
    : isLocked
      ? isLastQuestion
        ? "Zobacz podsumowanie"
        : "Dalej"
      : "Sprawdź";

  const canFooterAct = reviewModeActive ? totalQuestions > 0 : isLocked || currentTaskReadyToCheck;

  const handleFooterPrimaryAction = () => {
    if (reviewModeActive || isLocked) {
      handleNext();
      return;
    }

    if (currentQuestion?.type === "single_question") {
      handleCheckSingleQuestion();
      return;
    }

    handleCheckGroupedQuestion();
  };

  const footerHelperText = useMemo(() => {
    if (reviewModeActive) {
      if (isLastQuestion) {
        return "Koniec przeglądu. Przejdź do podsumowania.";
      }

      return "Tryb przeglądu: sprawdzaj wszystkie pytania po kolei.";
    }

    if (!isLocked) {
      if (currentQuestion?.type !== "single_question") {
        return "Najpierw zaznacz wszystkie podpunkty i kliknij Sprawdz.";
      }

      if (isLastQuestion) {
        return "Najpierw wybierz odpowiedź, aby zobaczyć podsumowanie.";
      }

      return "Najpierw wybierz odpowiedź, aby przejść dalej.";
    }

    return undefined;
  }, [currentQuestion, isLastQuestion, isLocked, reviewModeActive]);

  const effectiveFooterHelperText = useMemo(() => {
    if (reviewModeActive) {
      if (isLastQuestion) {
        return "Koniec przeglądu. Przejdź do podsumowania.";
      }

      return "Tryb przeglądu: sprawdzaj wszystkie pytania po kolei.";
    }

    if (!isLocked) {
      if (currentQuestion?.type === "single_question") {
        if (isLastQuestion) {
          return "Zaznacz odpowiedź i kliknij Sprawdź, aby zobaczyć podsumowanie.";
        }

        return "Zaznacz odpowiedź i kliknij Sprawdź.";
      }

      return "Zaznacz wszystkie podpunkty i kliknij Sprawdź.";
    }

    return undefined;
  }, [currentQuestion, isLastQuestion, isLocked, reviewModeActive]);
  if (isLoading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_-12%,rgba(79,70,229,0.18),rgba(5,5,16,1)_46%)] text-white">
        <QuizHalftoneBackground variant="quiz" />
        <div className="mx-auto w-full max-w-[1300px] px-4 pb-20 md:px-6 xl:px-8 min-[1440px]:max-w-[1380px] min-[1440px]:px-10 2xl:max-w-[1520px] min-[2200px]:max-w-[1680px] min-[2200px]:px-12">
          <div className="mx-auto max-w-md xl:max-w-[740px] min-[1440px]:max-w-[920px] 2xl:max-w-[1040px] min-[2200px]:max-w-[1160px]">
            <QuizHeader modeLabel={toModeLabel(mode)} current={0} total={10} elapsedSeconds={elapsedSeconds} soundEnabled={soundEnabled} onToggleSound={toggleSound} />
            <div className="mt-5 animate-pulse space-y-3 xl:mt-5 xl:space-y-3.5">
              <div className="h-12 rounded-2xl bg-white/6" />
              <div className="h-24 rounded-2xl bg-white/6" />
              <div className="h-14 rounded-2xl bg-white/6" />
              <div className="h-14 rounded-2xl bg-white/6" />
              <div className="h-14 rounded-2xl bg-white/6" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_-12%,rgba(79,70,229,0.18),rgba(5,5,16,1)_46%)] text-white">
        <QuizHalftoneBackground variant="quiz" />
        <div className="mx-auto w-full max-w-[1300px] px-4 pb-10 md:px-6 xl:px-8 min-[1440px]:max-w-[1380px] min-[1440px]:px-10 2xl:max-w-[1520px] min-[2200px]:max-w-[1680px] min-[2200px]:px-12">
          <div className="mx-auto max-w-md xl:max-w-[740px] min-[1440px]:max-w-[920px] 2xl:max-w-[1040px] min-[2200px]:max-w-[1160px]">
            <QuizHeader modeLabel={toModeLabel(mode)} current={0} total={0} elapsedSeconds={elapsedSeconds} soundEnabled={soundEnabled} onToggleSound={toggleSound} />
            <div className="mt-5 rounded-3xl border border-red-300/20 bg-red-500/10 p-5 xl:p-6">
              <h2 className="text-lg font-semibold text-white">{"Nie udało się załadować quizu"}</h2>
              <p className="mt-2 text-sm text-red-100/90 xl:text-[15px]">{"Spróbuj ponownie za chwilę lub uruchom inny zestaw."}</p>
              {error ? <p className="mt-3 text-xs leading-relaxed text-red-100/75 xl:text-sm">{error}</p> : null}
              <button
                type="button"
                onClick={() => {
                  void hydrateSession();
                }}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 py-3 text-sm font-semibold text-white xl:py-3.5"
              >
                {"Spróbuj ponownie"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  if (sessionStatus === "finished" && !reviewModeActive) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_80%_25%_at_50%_0%,#1e1a6020_0%,transparent_100%),#0C0E1A] text-white">
        <QuizHalftoneBackground variant="results" />
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-[10%] top-[38%] h-[24px] bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.22)_0%,rgba(52,211,153,0.09)_34%,transparent_72%)] blur-2xl" />
          <div className="absolute inset-x-[10%] top-[calc(38%+18px)] h-[24px] bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.2)_0%,rgba(251,191,36,0.09)_34%,transparent_72%)] blur-2xl" />
          {RESULTS_BACKGROUND_ICONS.map(({ Icon, className }, index) => (
            <Icon key={`results-icon-${index}`} className={`absolute ${className}`} strokeWidth={1.8} />
          ))}
        </div>
        <div className="mx-auto w-full max-w-[1300px] px-4 pb-8 md:px-6 xl:px-8 min-[1440px]:max-w-[1380px] min-[1440px]:px-10 2xl:max-w-[1520px] min-[2200px]:max-w-[1680px] min-[2200px]:px-12">
          <ResultsHeader backHref="/e8" />
          <QuizSummaryCard
            summary={summary}
            sessionId={sessionId}
            mode={mode}
            questions={questions}
            answers={Object.values(answers)}
          />
        </div>
      </main>
    );
  }

  const progressPercent = totalQuestions > 0 ? Math.round((safeCurrent / totalQuestions) * 100) : 0;
  const desktopHelperText =
    footerHelperText ??
    (failedSaveCount <= 0
      ? ""
      : failedSaveCount === 1
        ? "1 odpowiedź czeka na synchronizację."
        : `${failedSaveCount} odpowiedzi czekają na synchronizację.`);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_-12%,rgba(79,70,229,0.18),rgba(5,5,16,1)_46%)] text-white">
        <QuizHalftoneBackground variant="quiz" />
      <div className="mx-auto w-full max-w-[1300px] px-4 pb-44 md:px-6 xl:px-8 xl:pb-16 min-[1440px]:max-w-[1380px] min-[1440px]:px-10 2xl:max-w-[1520px] min-[2200px]:max-w-[1680px] min-[2200px]:px-12">
        <div className="xl:mx-auto xl:max-w-[1120px] min-[1440px]:max-w-[1240px] 2xl:max-w-[1380px] min-[2200px]:max-w-[1540px]">
          <QuizHeader modeLabel={toModeLabel(mode)} current={safeCurrent} total={totalQuestions} elapsedSeconds={reviewModeActive ? undefined : elapsedSeconds} soundEnabled={soundEnabled} onToggleSound={toggleSound} />

          <div className="xl:mt-3 xl:grid xl:grid-cols-[minmax(0,720px)_minmax(340px,360px)] xl:items-start xl:justify-between xl:gap-5 min-[1440px]:mt-4 min-[1440px]:grid-cols-[minmax(0,790px)_minmax(380px,410px)] min-[1440px]:gap-8 2xl:grid-cols-[minmax(0,900px)_minmax(420px,440px)] 2xl:gap-10 min-[2200px]:grid-cols-[minmax(0,1020px)_minmax(460px,480px)] min-[2200px]:gap-12">
            <div className="max-w-[740px] min-[1440px]:max-w-[790px] 2xl:max-w-[900px] min-[2200px]:max-w-[1020px]">
              <div className="xl:hidden">
                <QuizQuestionNav statuses={questionStatuses} currentIndex={currentQuestionIndex} maxReachableIndex={reviewModeActive ? undefined : maxReachableIndex} onJump={handleJumpToQuestion} />
              </div>

              <section data-onboarding-target="question-area" className="mt-2.5 rounded-2xl border border-indigo-300/18 bg-[radial-gradient(circle_at_50%_100%,rgba(99,102,241,0.2),rgba(12,15,36,0.95)_44%,rgba(6,8,18,0.98)_100%)] px-4 py-4 shadow-[0_24px_38px_-30px_rgba(99,102,241,0.58)] xl:mt-0 xl:px-5 xl:py-5 min-[1440px]:px-6 min-[1440px]:py-6 2xl:px-7 2xl:py-7 min-[2200px]:px-8 min-[2200px]:py-8">
                {currentQuestion.type === "single_question" ? (
                  <QuestionCard category={currentQuestion.category} prompt={currentQuestion.prompt} />
                ) : (
                  <section className={`space-y-4 xl:space-y-4 ${currentQuestion.type === "gap_fill_text" ? "xl:max-w-[700px] min-[1440px]:max-w-[760px] 2xl:max-w-[860px] min-[2200px]:max-w-[960px]" : "xl:max-w-[720px] min-[1440px]:max-w-[780px] 2xl:max-w-[880px] min-[2200px]:max-w-[980px]"}`}>
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.14em] text-indigo-100/58 uppercase xl:text-[11px]">{currentQuestion.category}</p>
                      {currentQuestion.title ? (
                          <h1 className="mt-2 text-[1.08rem] leading-7 font-semibold tracking-[-0.01em] text-white xl:mt-2 xl:text-[1.22rem] xl:leading-8 min-[1440px]:text-[1.32rem]">
                          {toDisplayTaskTitle(currentQuestion.title, currentQuestion.type)}
                        </h1>
                      ) : null}
                      <div
                        className={`mt-3 text-white/92 ${
                          currentQuestion.type === "gap_fill_text"
                            ? "rounded-[1.2rem] border border-white/[0.08] bg-white/[0.02] px-3.5 py-3.5 text-[0.98rem] leading-[1.72] xl:px-4 xl:py-3.5 xl:text-[1.04rem] xl:leading-8 min-[1440px]:px-5 min-[1440px]:text-[1.08rem]"
                            : "border-l-2 border-l-indigo-300/40 pl-3.5 text-[1rem] leading-[1.72] xl:pl-4 xl:text-[1rem] xl:leading-7 min-[1440px]:pl-5 min-[1440px]:text-[1.04rem]"
                        }`}
                      >
                        {currentQuestion.type === "gap_fill_text" ? (
                            <div className="max-w-[62ch] whitespace-pre-line text-justify min-[1440px]:max-w-[68ch]">
                            {renderGapFillPassage({
                              passage: currentDisplayedPassage ?? currentQuestion.passage,
                              chipStateById: new Map(
                                currentItems.flatMap((item) => {
                                  const selectedOptionId = answers[item.id]?.selectedOptionId ?? draftSelections[item.id];
                                  const selectedOption = item.options.find((option) => option.id === selectedOptionId);

                                  if (!selectedOption) {
                                    return [];
                                  }

                                  const savedAnswer = answers[item.id];

                                  return [[
                                    item.id,
                                    {
                                      text: selectedOption.text,
                                      status: savedAnswer
                                        ? savedAnswer.isCorrect
                                          ? "correct"
                                          : "wrong"
                                        : "draft",
                                    },
                                  ] as const];
                                }),
                              ),
                            })}
                          </div>
                        ) : (
                          <div className="grid">
                            <div className="col-start-1 row-start-1 max-w-[62ch] whitespace-pre-line text-justify min-[1440px]:max-w-[68ch]">
                              {currentDisplayedPassage ?? currentQuestion.passage}
                            </div>
                            {alternateDisplayedPassage ? (
                              <div
                                aria-hidden="true"
                                className="invisible col-start-1 row-start-1 max-w-[62ch] whitespace-pre-line text-justify min-[1440px]:max-w-[68ch]"
                              >
                                {alternateDisplayedPassage}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                      {currentQuestion.type === "gap_fill_text" ? (
                        <p className="mt-2 text-[11px] leading-5 text-indigo-100/62 xl:text-xs">
                          Spójrz na luki w tekście i wybierz odpowiedź do każdej z nich poniżej.
                        </p>
                      ) : null}
                    </div>

                  </section>
                )}

                {currentQuestion.type === "single_question" ? (
                  <QuizUtilityRow
                    fiftyFiftyUsed={currentFiftyFiftyUsed}
                    disabled={isLocked || reviewModeActive}
                    onHintToggle={handleToggleHint}
                    onUseFiftyFifty={handleUseFiftyFifty}
                  />
                ) : currentQuestion.passageTranslation ? (
                  <section className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setTranslatedPassageMap((prev) => ({
                          ...prev,
                          [currentQuestion.id]: !prev[currentQuestion.id],
                        }));
                      }}
                      className="inline-flex h-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] px-3 text-[11px] font-medium text-white/62 transition-colors hover:bg-white/[0.05] hover:text-white/82"
                    >
                      {showTranslatedPassage ? "Pokaż po angielsku" : "Pokaż po polsku"}
                    </button>
                  </section>
                ) : null}
              </section>

              <div
                className={`overflow-hidden transition-all duration-200 ease-out ${
                  currentHintVisible && currentHintUsed ? "mt-1.5 max-h-24 opacity-100 xl:mt-2" : "mt-0 max-h-0 opacity-0"
                }`}
              >
                <div
                  className={`rounded-lg border border-indigo-300/20 bg-indigo-500/[0.1] px-2.5 py-1.5 text-[11px] leading-relaxed text-indigo-100/92 transition-transform duration-200 xl:px-3.5 xl:py-2 xl:text-[12px] ${
                    currentHintVisible && currentHintUsed ? "translate-y-0" : "-translate-y-1"
                  }`}
                >
                  <span className="mr-1 text-[10px] font-bold tracking-[0.12em] text-indigo-200/85 uppercase">Wskazowka</span>
                  {currentHintText}
                </div>
              </div>

              {currentQuestion.type === "single_question" ? (
                <AnswerList
                  options={currentQuestion.options}
                  selectedOptionId={selectedOptionId}
                  correctOptionId={correctOptionId}
                  hiddenOptionId={currentHiddenOptionId}
                  isLocked={isLocked || reviewModeActive}
                  onSelect={handleSelectOption}
                />
              ) : (
                <section className={`mt-3 space-y-2.5 xl:mt-5 ${currentQuestion.type === "gap_fill_text" ? "xl:max-w-[720px] min-[1440px]:max-w-[780px] 2xl:max-w-[900px] min-[2200px]:max-w-[1020px]" : "min-[1440px]:max-w-[790px] 2xl:max-w-[900px] min-[2200px]:max-w-[1020px]"}`}>
                  {currentItems.map((item, index) => {
                    const savedAnswer = answers[item.id];
                    const selectedOptionIdForItem = savedAnswer?.selectedOptionId ?? draftSelections[item.id] ?? null;
                    const correctOptionIdForItem = item.options.find((option) => option.isCorrect)?.id ?? null;
                    const isAnswered = Boolean(selectedOptionIdForItem);

                    return (
                      <div
                        key={item.id}
                        className={`rounded-[1.35rem] border px-3 py-3 xl:px-4 xl:py-3.5 2xl:px-5 2xl:py-4.5 min-[2200px]:px-6 min-[2200px]:py-5 ${
                          currentQuestion.type === "gap_fill_text"
                            ? savedAnswer
                              ? savedAnswer.isCorrect
                                ? "border-emerald-300/45 bg-[linear-gradient(180deg,rgba(34,197,94,0.05),rgba(255,255,255,0.02))]"
                                : "border-rose-300/40 bg-[linear-gradient(180deg,rgba(248,113,113,0.05),rgba(255,255,255,0.02))]"
                              : isAnswered
                                ? "border-indigo-300/20 bg-[linear-gradient(180deg,rgba(99,102,241,0.08),rgba(255,255,255,0.025))]"
                                : "border-white/10 bg-white/[0.02]"
                            : "border-white/10 bg-white/[0.02]"
                        }`}
                      >
                        <div className="mb-2.5 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                              {currentQuestion.type === "gap_fill_text" ? (
                                <>
                                  <span className="text-[13px] font-medium text-indigo-100/84">Luka {index + 1}</span>
                                </>
                              ) : (
                                <span className="text-[11px] font-semibold tracking-[0.14em] text-indigo-200/68 uppercase">
                                  Pytanie {index + 1}
                                </span>
                              )}
                            </div>
                            {currentQuestion.type === "gap_fill_text" ? null : (
                              <p className="text-[0.94rem] leading-6 font-semibold text-white xl:text-[1rem] xl:leading-7 2xl:text-[1.06rem] 2xl:leading-8 min-[2200px]:text-[1.1rem]">
                                {`${index + 1}. ${item.prompt}`}
                              </p>
                            )}
                          </div>
                        </div>

                        {currentQuestion.type === "gap_fill_text" && savedAnswer ? (
                          renderGapFillReviewedOptions({
                            item,
                            selectedOptionId: selectedOptionIdForItem,
                          })
                        ) : (
                          <AnswerList
                            options={item.options}
                            selectedOptionId={selectedOptionIdForItem}
                            correctOptionId={correctOptionIdForItem}
                            hiddenOptionId={null}
                            isLocked={Boolean(savedAnswer) || reviewModeActive}
                            onSelect={(optionId) => {
                              handleSelectGroupedOption(item.id, optionId);
                            }}
                          />
                        )}
                      </div>
                    );
                  })}

                </section>
              )}

              {!isLocked && !reviewModeActive && taskValidationMessage ? (
                <p className="mt-3 text-sm text-amber-200">{taskValidationMessage}</p>
              ) : null}

              {currentQuestion.type !== "single_question" && currentTaskAnswered ? (
                <div className="xl:hidden">
                  <ExplanationPanel
                    isCorrect={currentQuestionPassed}
                    explanation={currentQuestion.explanation}
                    patternTip={currentQuestion.patternTip}
                    warningTip={currentQuestion.warningTip}
                  />
                  <p className="mt-1.5 text-xs text-indigo-100/70">
                    {currentQuestionSaveState === "pending"
                      ? pendingSaveCount > 0
                        ? "Odpowiedz dodana lokalnie. Synchronizacja trwa w tle."
                        : "Zapisywanie odpowiedzi..."
                      : currentQuestionSaveState === "error"
                        ? "Brak polaczenia. Odpowiedz zostanie wyslana ponownie automatycznie."
                        : "Odpowiedz zapisana."}
                  </p>
                </div>
              ) : null}

              {currentAnswer ? (
                <div className="xl:hidden">
                  <ExplanationPanel
                    isCorrect={currentAnswer.isCorrect}
                    explanation={currentQuestion.explanation}
                    patternTip={currentQuestion.patternTip}
                    warningTip={currentQuestion.warningTip}
                  />
                  <p className="mt-1.5 text-xs text-indigo-100/70">
                    {currentAnswer.saveState === "pending"
                      ? pendingSaveCount > 0
                        ? "Odpowiedź dodana lokalnie. Synchronizacja trwa w tle."
                        : "Zapisywanie odpowiedzi..."
                      : currentAnswer.saveState === "error"
                        ? "Brak połączenia. Odpowiedź zostanie wysłana ponownie automatycznie."
                        : "Odpowiedź zapisana."}
                  </p>
                </div>
              ) : null}
            </div>

            <aside className="hidden xl:block xl:sticky xl:top-[104px] min-[1440px]:top-[112px] min-[2200px]:top-[118px]">
              <div className="space-y-3">
                <section className="rounded-2xl border border-white/12 bg-[linear-gradient(165deg,rgba(11,14,31,0.95),rgba(8,10,22,0.97))] p-5 shadow-[0_24px_38px_-30px_rgba(59,130,246,0.55)] 2xl:p-6 min-[2200px]:p-7">
                  <div className="mt-0">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] text-indigo-100/72">
                      <span>{"Postęp"}</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500/95 to-blue-500/95" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <QuizQuestionNav
                      statuses={questionStatuses}
                      currentIndex={currentQuestionIndex}
                      maxReachableIndex={reviewModeActive ? undefined : maxReachableIndex}
                      onJump={handleJumpToQuestion}
                      desktopCompact
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleFooterPrimaryAction}
                    disabled={!canFooterAct || sessionStatus === "loading_next"}
                    className="mt-4 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 py-3.5 text-base font-semibold text-white shadow-[0_14px_34px_-22px_rgba(59,130,246,0.8)] transition-all duration-150 active:scale-[0.992] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {sessionStatus === "loading_next" ? "Ładowanie..." : footerActionLabel}
                  </button>

                  <p className="mt-1.5 text-center text-[11px] text-indigo-100/68">{effectiveFooterHelperText ?? desktopHelperText}</p>
                </section>

                {currentQuestion.type !== "single_question" && currentTaskAnswered ? (
                  <section>
                    <ExplanationPanel
                      isCorrect={currentQuestionPassed}
                      explanation={currentQuestion.explanation}
                      patternTip={currentQuestion.patternTip}
                      warningTip={currentQuestion.warningTip}
                    />
                    <p className="mt-1.5 text-[12px] text-indigo-100/70">
                      {currentQuestionSaveState === "pending"
                        ? pendingSaveCount > 0
                          ? "Odpowiedz dodana lokalnie. Synchronizacja trwa w tle."
                          : "Zapisywanie odpowiedzi..."
                        : currentQuestionSaveState === "error"
                          ? "Brak polaczenia. Odpowiedz zostanie wyslana ponownie automatycznie."
                          : "Odpowiedz zapisana."}
                    </p>
                  </section>
                ) : null}

                {currentAnswer ? (
                  <section>
                    <ExplanationPanel
                      isCorrect={currentAnswer.isCorrect}
                      explanation={currentQuestion.explanation}
                      patternTip={currentQuestion.patternTip}
                      warningTip={currentQuestion.warningTip}
                    />
                    <p className="mt-1.5 text-[12px] text-indigo-100/70">
                      {currentAnswer.saveState === "pending"
                        ? pendingSaveCount > 0
                          ? "Odpowiedź dodana lokalnie. Synchronizacja trwa w tle."
                          : "Zapisywanie odpowiedzi..."
                        : currentAnswer.saveState === "error"
                          ? "Brak połączenia. Odpowiedź zostanie wysłana ponownie automatycznie."
                          : "Odpowiedź zapisana."}
                    </p>
                  </section>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </div>

      <QuizFooterAction
        canAct={canFooterAct}
        isTransitioning={sessionStatus === "loading_next"}
        failedSaveCount={failedSaveCount}
        actionLabel={footerActionLabel}
        helperText={effectiveFooterHelperText}
        onAction={handleFooterPrimaryAction}
        className="xl:hidden"
      />

      <QuizOnboardingOverlay
        visible={onboardingVisible}
        stepIndex={onboardingStep}
        steps={QUIZ_ONBOARDING_STEPS}
        onNext={handleOnboardingNext}
        onSkip={handleOnboardingSkip}
      />
    </main>
  );
}





























