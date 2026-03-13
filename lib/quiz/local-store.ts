import { getMockQuestions } from "@/lib/quiz/mock-data";
import { buildSummary, clampQuestionCount } from "@/lib/quiz/repository";
import type { QuizAnswerSnapshot, QuizQuestion, QuizSummary } from "@/lib/quiz/types";

type LocalSession = {
  id: string;
  mode: string;
  status: "in_progress" | "completed";
  questionCount: number;
  questions: ReturnType<typeof getMockQuestions>;
  answers: Record<string, QuizAnswerSnapshot>;
  startedAt: string;
  completedAt?: string;
  summary?: QuizSummary;
};

type GlobalWithStore = typeof globalThis & {
  __naiczycielQuizLocalStore?: Map<string, LocalSession>;
};

function getStore() {
  const root = globalThis as GlobalWithStore;

  if (!root.__naiczycielQuizLocalStore) {
    root.__naiczycielQuizLocalStore = new Map<string, LocalSession>();
  }

  return root.__naiczycielQuizLocalStore;
}

function newLocalSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `local_${crypto.randomUUID()}`;
  }

  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isLocalSessionId(sessionId: string) {
  return sessionId.startsWith("local_");
}

export function getLocalSession(sessionId: string): LocalSession | null {
  return getStore().get(sessionId) ?? null;
}

export function createLocalSession(params: {
  mode: string;
  questionCount: number;
  sessionId?: string;
}) {
  const mode = params.mode || "reactions";
  const questionCount = clampQuestionCount(params.questionCount);
  const id = params.sessionId ?? newLocalSessionId();

  const session: LocalSession = {
    id,
    mode,
    status: "in_progress",
    questionCount,
    questions: getMockQuestions(mode, questionCount),
    answers: {},
    startedAt: new Date().toISOString(),
  };

  getStore().set(id, session);
  return session;
}

export function createLocalSessionFromQuestions(params: {
  mode: string;
  questions: QuizQuestion[];
  sessionId?: string;
}) {
  const mode = params.mode || "reactions";
  const id = params.sessionId ?? newLocalSessionId();

  const uniqueQuestions = params.questions.filter((question, index, arr) => {
    return question && typeof question.id === "string" && question.id.length > 0 && arr.findIndex((item) => item.id === question.id) === index;
  });

  const session: LocalSession = {
    id,
    mode,
    status: "in_progress",
    questionCount: uniqueQuestions.length,
    questions: uniqueQuestions,
    answers: {},
    startedAt: new Date().toISOString(),
  };

  getStore().set(id, session);
  return session;
}

function ensureLocalSession(sessionId: string) {
  const existing = getLocalSession(sessionId);

  if (existing) {
    return existing;
  }

  return createLocalSession({
    mode: "reactions",
    questionCount: 10,
    sessionId,
  });
}

export function getLocalSessionPayload(sessionId: string) {
  const session = getLocalSession(sessionId);

  if (!session) {
    return null;
  }

  return {
    sessionId: session.id,
    mode: session.mode,
    status: session.status,
    questions: session.questions,
    answers: Object.values(session.answers),
  };
}

export function saveLocalAnswer(params: {
  sessionId: string;
  questionId: string;
  optionId: string;
  isCorrect: boolean;
}) {
  const session = ensureLocalSession(params.sessionId);

  session.answers[params.questionId] = {
    questionId: params.questionId,
    selectedOptionId: params.optionId,
    isCorrect: params.isCorrect,
  };

  getStore().set(session.id, session);

  return session.answers[params.questionId];
}

export function completeLocalSession(params: {
  sessionId: string;
  mode?: string;
  summary?: QuizSummary;
}) {
  const session = ensureLocalSession(params.sessionId);

  if (params.mode) {
    session.mode = params.mode;
  }

  const answers = Object.values(session.answers);
  const computedSummary = buildSummary({
    questions: session.questions,
    answers,
  });

  const summary = params.summary ?? computedSummary;

  session.status = "completed";
  session.completedAt = new Date().toISOString();
  session.summary = summary;

  getStore().set(session.id, session);

  return {
    session,
    summary,
  };
}


