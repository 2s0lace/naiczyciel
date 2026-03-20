"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnswerList } from "@/components/quiz/answer-list";
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
import type { QuizAnswerSnapshot, QuizQuestion, QuizSessionPayload, QuizSummary } from "@/lib/quiz/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { QUIZ_SOUND_MUTED_STORAGE_KEY, quizSoundManager } from "@/lib/quiz/quiz-sound-manager";

type QuizScreenProps = {
  sessionId: string;
  initialMode: string;
  initialReviewMode?: boolean;
  initialSetId?: string;
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

function toModeLabel(mode: string): string {
  if (mode === "reactions") {
    return "Reakcje";
  }

  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function sanitizeWarning(value: string): string {
  return value.replace(/^uwaga\s*:\s*/i, "").trim();
}

function resolveHintText(question: QuizQuestion | null): string {
  if (!question) {
    return "";
  }

  if (question.warningTip) {
    const cleaned = sanitizeWarning(question.warningTip);

    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  return "Zwróć uwagę na naturalny ton reakcji i unikaj tłumaczenia dosłownego.";
}

type PersistedQuizProgress = {
  version: 1;
  currentQuestionIndex: number;
  answers: Record<string, LocalAnswerState>;
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

function readInitialSoundEnabled(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(QUIZ_SOUND_MUTED_STORAGE_KEY) !== "1";
  } catch {
    return true;
  }
}


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
function buildSummaryFromLocal(questions: QuizQuestion[], answers: Record<string, LocalAnswerState>): QuizSummary {
  const totalQuestions = questions.length;

  let correctAnswers = 0;
  const areaStats: Record<string, { total: number; correct: number }> = {};

  for (const question of questions) {
    const area = question.category || "Reakcje";
    const current = areaStats[area] ?? { total: 0, correct: 0 };
    current.total += 1;

    const answer = answers[question.id];

    if (answer?.isCorrect) {
      correctAnswers += 1;
      current.correct += 1;
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

  return {
    totalQuestions,
    correctAnswers,
    scorePercent: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    strongestArea: rankedAreas[0]?.area,
    weakestArea: rankedAreas[rankedAreas.length - 1]?.area,
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

function buildSessionContextKey(mode: string, setId: string | undefined): string {
  return setId ? `set:${setId}` : `mode:${mode}`;
}

export function QuizScreen({ sessionId, initialMode, initialReviewMode = false, initialSetId }: QuizScreenProps) {
  const [mode, setMode] = useState(initialMode);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, LocalAnswerState>>({});
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
  const [soundEnabled, setSoundEnabled] = useState<boolean>(readInitialSoundEnabled);

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
  const activeSessionStorageKey = useMemo(
    () => buildSessionContextKey(mode, normalizedSetId),
    [mode, normalizedSetId],
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
      const sanitizedAnswers: Record<string, LocalAnswerState> = {};

      const rawAnswers = parsed.answers ?? {};

      for (const [questionId, answer] of Object.entries(rawAnswers)) {
        const question = questionById.get(questionId);

        if (!question || !answer || typeof answer !== "object") {
          continue;
        }

        const selectedOptionId = typeof answer.selectedOptionId === "string" ? answer.selectedOptionId : "";

        if (!selectedOptionId || !question.options.some((option) => option.id === selectedOptionId)) {
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

        if (!question) {
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

  const correctOptionId = useMemo(
    () => currentQuestion?.options.find((option) => option.isCorrect)?.id ?? null,
    [currentQuestion],
  );

  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const currentHintVisible = currentQuestion ? Boolean(hintVisibleMap[currentQuestion.id]) : false;
  const currentHintUsed = currentQuestion ? Boolean(hintUsedMap[currentQuestion.id]) : false;
  const currentFiftyFiftyUsed = currentQuestion ? Boolean(fiftyFiftyUsedMap[currentQuestion.id]) : false;
  const currentHiddenOptionId = currentQuestion ? hiddenOptionMap[currentQuestion.id] ?? null : null;
  const currentHintText = useMemo(() => resolveHintText(currentQuestion), [currentQuestion]);

  const summary = useMemo(() => {
    return buildSummaryFromLocal(questions, answers);
  }, [answers, questions]);


  const maxReachableIndex = useMemo(() => {
    if (!questions.length) {
      return 0;
    }

    const firstUnanswered = questions.findIndex((question) => !answers[question.id]);
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

      const answer = answers[question.id];

      if (!answer) {
        return "idle";
      }

      return answer.isCorrect ? "correct" : "wrong";
    });
  }, [answers, currentQuestionIndex, questions]);

  const syncQuestionState = useCallback(
    (rawIndex: number) => {
      if (!questions.length) {
        return;
      }

      const boundedIndex = Math.max(0, Math.min(questions.length - 1, rawIndex));
      const nextQuestion = questions[boundedIndex];
      const existingAnswer = answersRef.current[nextQuestion.id];

      setCurrentQuestionIndex(boundedIndex);

      if (existingAnswer) {
        setSelectedOptionId(existingAnswer.selectedOptionId);
        setIsLocked(true);
        setSessionStatus(existingAnswer.isCorrect ? "answered_correct" : "answered_incorrect");
        return;
      }

      setSelectedOptionId(null);
      setIsLocked(false);
      setSessionStatus("idle");
    },
    [questions],
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
          // Keep local completion state even if sync fails.
        }
      })();
    },
    [getAuthHeaders, mode, normalizedSetId, sessionId],
  );

  const hydrateSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setElapsedSeconds(0);
    setIsTimerStoppedAfterLastAnswer(false);
    setHasStartedQuizInteraction(false);
    setReviewModeActive(initialReviewMode);
    setIsCompletedSession(false);
    completionSoundPlayedRef.current = false;
    shouldPlayCompletionSoundRef.current = false;
    hasSoundInteractionRef.current = false;
    onboardingCheckedRef.current = false;

    try {
      const authHeaders = await getAuthHeaders();

      const query = new URLSearchParams({ mode: initialMode });

      if (!normalizedSetId) {
        query.set("count", "10");
      }

      if (normalizedSetId) {
        query.set("set", normalizedSetId);
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
          ? payload.error
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

      const questionById = new Map(data.questions.map((question) => [question.id, question]));
      const persistedProgress = readPersistedProgress(data.questions);
      const hydratedAnswers: Record<string, LocalAnswerState> = {};
      const answerList = Array.isArray(data.answers) ? data.answers : [];

      for (const answer of answerList) {
        const question = questionById.get(answer.questionId);

        if (!question) {
          continue;
        }

        if (!question.options.some((option) => option.id === answer.selectedOptionId)) {
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

      const allAnswered = data.questions.every((question) => Boolean(mergedAnswers[question.id]));
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
        const firstUnansweredIndex = data.questions.findIndex((question) => !mergedAnswers[question.id]);
        const fallbackIndex = firstUnansweredIndex === -1 ? Math.max(data.questions.length - 1, 0) : firstUnansweredIndex;

        if (persistedProgress) {
          targetIndex = Math.min(persistedProgress.currentQuestionIndex, fallbackIndex);
        } else {
          targetIndex = fallbackIndex;
        }
      }

      targetIndex = Math.max(0, Math.min(data.questions.length - 1, targetIndex));

      const targetQuestion = data.questions[targetIndex];
      const targetAnswer = targetQuestion ? mergedAnswers[targetQuestion.id] : undefined;

      setCurrentQuestionIndex(targetIndex);

      if (completedFromPayload && !shouldStartInReview) {
        setSelectedOptionId(targetAnswer?.selectedOptionId ?? null);
        setIsLocked(Boolean(targetAnswer));
        setSessionStatus("finished");
        didCompleteRef.current = true;
      } else if (targetAnswer) {
        setSelectedOptionId(targetAnswer.selectedOptionId);
        setIsLocked(true);
        setSessionStatus(targetAnswer.isCorrect ? "answered_correct" : "answered_incorrect");
        didCompleteRef.current = false;
      } else {
        setSelectedOptionId(null);
        setIsLocked(false);
        setSessionStatus("idle");
        didCompleteRef.current = false;
      }

      const hasAnyInteraction =
        Object.keys(mergedAnswers).length > 0 ||
        Object.keys(restoredHintUsed).length > 0 ||
        Object.keys(restoredFiftyUsed).length > 0;

      setHasStartedQuizInteraction(hasAnyInteraction);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Wystapil blad ladowania.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, initialMode, initialReviewMode, normalizedSetId, readPersistedProgress, sessionId]);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);
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
    if (!currentQuestion || isLocked || reviewModeActive) {
      return;
    }

    if (hiddenOptionMap[currentQuestion.id] === optionId) {
      return;
    }

    if (answersRef.current[currentQuestion.id]) {
      return;
    }

    const chosenOption = currentQuestion.options.find((option) => option.id === optionId);

    if (!chosenOption) {
      return;
    }

    registerSoundInteraction();
    playFeedbackSound(chosenOption.isCorrect);

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
    if (!currentQuestion || isLocked || reviewModeActive || fiftyFiftyUsedMap[currentQuestion.id]) {
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
  const canGoNext = reviewModeActive ? totalQuestions > 0 : isLocked;

  const footerHelperText = useMemo(() => {
    if (reviewModeActive) {
      if (isLastQuestion) {
        return "Koniec przeglądu. Przejdź do podsumowania.";
      }

      return "Tryb przeglądu: sprawdzaj wszystkie pytania po kolei.";
    }

    if (!isLocked) {
      if (isLastQuestion) {
        return "Najpierw wybierz odpowiedź, aby zobaczyć podsumowanie.";
      }

      return "Najpierw wybierz odpowiedź, aby przejść dalej.";
    }

    return undefined;
  }, [isLastQuestion, isLocked, reviewModeActive]);
  if (isLoading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_-12%,rgba(79,70,229,0.18),rgba(5,5,16,1)_46%)] text-white">
        <QuizHalftoneBackground variant="quiz" />
        <div className="mx-auto w-full max-w-[1300px] px-4 pb-20 md:px-6 xl:px-8">
          <div className="mx-auto max-w-md xl:max-w-[740px]">
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
        <div className="mx-auto w-full max-w-[1300px] px-4 pb-10 md:px-6 xl:px-8">
          <div className="mx-auto max-w-md xl:max-w-[740px]">
            <QuizHeader modeLabel={toModeLabel(mode)} current={0} total={0} elapsedSeconds={elapsedSeconds} soundEnabled={soundEnabled} onToggleSound={toggleSound} />
            <div className="mt-5 rounded-3xl border border-red-300/20 bg-red-500/10 p-5 xl:p-6">
              <h2 className="text-lg font-semibold text-white">{"Nie udało się załadować quizu"}</h2>
              <p className="mt-2 text-sm text-red-100/90 xl:text-[15px]">{"Spróbuj ponownie za chwilę lub uruchom inny zestaw."}</p>
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
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_-12%,rgba(79,70,229,0.18),rgba(5,5,16,1)_46%)] text-white">
        <QuizHalftoneBackground variant="results" />
        <div className="mx-auto w-full max-w-[1300px] px-4 pb-10 md:px-6 xl:px-8">
          <ResultsHeader backHref="/e8" />
          <QuizSummaryCard summary={summary} sessionId={sessionId} mode={mode} />
        </div>
      </main>
    );
  }

  const progressPercent = totalQuestions > 0 ? Math.round((safeCurrent / totalQuestions) * 100) : 0;
  const desktopHelperText =
    footerHelperText ??
    (failedSaveCount <= 0
      ? "Natychmiastowy feedback, zapis w tle."
      : failedSaveCount === 1
        ? "1 odpowiedź czeka na synchronizację."
        : `${failedSaveCount} odpowiedzi czekają na synchronizację.`);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_-12%,rgba(79,70,229,0.18),rgba(5,5,16,1)_46%)] text-white">
        <QuizHalftoneBackground variant="quiz" />
      <div className="mx-auto w-full max-w-[1300px] px-4 pb-36 md:px-6 xl:px-8 xl:pb-16">
        <div className="xl:mx-auto xl:max-w-[1120px]">
          <QuizHeader modeLabel={toModeLabel(mode)} current={safeCurrent} total={totalQuestions} elapsedSeconds={reviewModeActive ? undefined : elapsedSeconds} soundEnabled={soundEnabled} onToggleSound={toggleSound} />

          <div className="xl:mt-3 xl:grid xl:grid-cols-[minmax(0,720px)_minmax(340px,360px)] xl:items-start xl:justify-between xl:gap-5">
            <div className="max-w-[740px]">
              <div className="xl:hidden">
                <QuizQuestionNav statuses={questionStatuses} currentIndex={currentQuestionIndex} maxReachableIndex={reviewModeActive ? undefined : maxReachableIndex} onJump={handleJumpToQuestion} />
              </div>

              <section data-onboarding-target="question-area" className="mt-2.5 rounded-2xl border border-indigo-300/18 bg-[radial-gradient(circle_at_50%_100%,rgba(99,102,241,0.2),rgba(12,15,36,0.95)_44%,rgba(6,8,18,0.98)_100%)] px-4 py-4 shadow-[0_24px_38px_-30px_rgba(99,102,241,0.58)] xl:mt-0 xl:px-5 xl:py-5">
                <QuestionCard category={currentQuestion.category} prompt={currentQuestion.prompt} />

                <QuizUtilityRow
                  fiftyFiftyUsed={currentFiftyFiftyUsed}
                  disabled={isLocked || reviewModeActive}
                  onHintToggle={handleToggleHint}
                  onUseFiftyFifty={handleUseFiftyFifty}
                />
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
                  <span className="mr-1 text-[10px] font-bold tracking-[0.12em] text-indigo-200/85 uppercase">Uwaga</span>
                  {currentHintText}
                </div>
              </div>

              <AnswerList
                options={currentQuestion.options}
                selectedOptionId={selectedOptionId}
                correctOptionId={correctOptionId}
                hiddenOptionId={currentHiddenOptionId}
                isLocked={isLocked || reviewModeActive}
                onSelect={handleSelectOption}
              />

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

            <aside className="hidden xl:block xl:sticky xl:top-[104px]">
              <div className="space-y-3">
                <section className="rounded-2xl border border-white/12 bg-[linear-gradient(165deg,rgba(11,14,31,0.95),rgba(8,10,22,0.97))] p-5 shadow-[0_24px_38px_-30px_rgba(59,130,246,0.55)]">
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
                    onClick={handleNext}
                    disabled={!canGoNext || sessionStatus === "loading_next"}
                    className="mt-4 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 py-3.5 text-base font-semibold text-white shadow-[0_14px_34px_-22px_rgba(59,130,246,0.8)] transition-all duration-150 active:scale-[0.992] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {sessionStatus === "loading_next" ? "Ładowanie..." : isLastQuestion ? "Zobacz podsumowanie" : "Dalej"}
                  </button>

                  <p className="mt-1.5 text-center text-[11px] text-indigo-100/68">{desktopHelperText}</p>
                </section>

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
        canGoNext={canGoNext}
        isLastQuestion={isLastQuestion}
        isTransitioning={sessionStatus === "loading_next"}
        failedSaveCount={failedSaveCount}
        helperText={footerHelperText}
        onNext={handleNext}
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





























