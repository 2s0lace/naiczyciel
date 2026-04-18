import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategoryBreakdownItem, QuizAnswerSnapshot, QuizQuestion } from "@/lib/quiz/types";

type GenericRecord = Record<string, unknown>;

export const CATEGORY_BREAKDOWN_ORDER = [
  { key: "reactions", label: "Reactions" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "grammar", label: "Grammar" },
  { key: "reading_mc", label: "Reading MC" },
] as const;

export type CanonicalCategoryKey = (typeof CATEGORY_BREAKDOWN_ORDER)[number]["key"];

export type CanonicalQuizSummary = {
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  categoryBreakdown: CategoryBreakdownItem[];
  strongestArea?: string;
  weakestArea?: string;
};

type SessionCategoryStatsRow = {
  session_id: string;
  category_key: CanonicalCategoryKey;
  category_label: string;
  attempts: number;
  correct_answers: number;
  percent: number | null;
  has_data: boolean;
  synced_at: string;
};

function asRecord(value: unknown): GenericRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as GenericRecord;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

export function normalizeCategoryLabel(value: string): string | null {
  const normalized = value.trim().toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ");

  if (!normalized) {
    return null;
  }

  if (normalized === "reactions" || normalized === "reakcje") {
    return "Reactions";
  }

  if (normalized === "vocabulary" || normalized === "slownictwo" || normalized === "słownictwo") {
    return "Vocabulary";
  }

  if (normalized === "grammar" || normalized === "gramatyka" || normalized === "gap fill text" || normalized === "gap_fill_text") {
    return "Grammar";
  }

  if (normalized === "reading mc" || normalized === "reading_mc" || normalized === "czytanie") {
    return "Reading MC";
  }

  return null;
}

export function categoryLabelToKey(label: string): CanonicalCategoryKey | null {
  const normalized = normalizeCategoryLabel(label);
  const match = CATEGORY_BREAKDOWN_ORDER.find((item) => item.label === normalized);
  return match?.key ?? null;
}

export function resolveQuestionCategoryLabel(question: QuizQuestion): string | null {
  if (question.type === "reading_mc") {
    return "Reading MC";
  }

  if (question.type === "gap_fill_text") {
    return "Grammar";
  }

  const fromMode = normalizeCategoryLabel(question.mode);

  if (fromMode) {
    return fromMode;
  }

  return normalizeCategoryLabel(question.category);
}

export function buildCanonicalCategoryBreakdown(params: {
  questions: QuizQuestion[];
  answers: QuizAnswerSnapshot[];
}): CategoryBreakdownItem[] {
  const answerMap = new Map(params.answers.map((answer) => [answer.questionId, answer]));
  const aggregates = new Map<string, { attempts: number; correct: number }>();

  for (const question of params.questions) {
    const label = resolveQuestionCategoryLabel(question);

    if (!label) {
      continue;
    }

    const questionIds =
      question.type === "single_question" ? [question.id] : question.questions.map((item) => item.id);

    const current = aggregates.get(label) ?? { attempts: 0, correct: 0 };
    current.attempts += questionIds.length;

    for (const questionId of questionIds) {
      const answer = answerMap.get(questionId);

      if (answer?.isCorrect) {
        current.correct += 1;
      }
    }

    aggregates.set(label, current);
  }

  return CATEGORY_BREAKDOWN_ORDER.map(({ label }) => {
    const stats = aggregates.get(label) ?? { attempts: 0, correct: 0 };

    return {
      label,
      attempts: stats.attempts,
      correct: stats.correct,
      percent: stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : null,
      has_data: stats.attempts > 0,
    };
  });
}

export function aggregateCategoryBreakdowns(items: CategoryBreakdownItem[]): CategoryBreakdownItem[] {
  const aggregate = new Map<string, { attempts: number; correct: number }>();

  for (const item of items) {
    const label = normalizeCategoryLabel(item.label);

    if (!label || item.attempts <= 0) {
      continue;
    }

    const current = aggregate.get(label) ?? { attempts: 0, correct: 0 };
    current.attempts += item.attempts;
    current.correct += item.correct;
    aggregate.set(label, current);
  }

  return CATEGORY_BREAKDOWN_ORDER.map(({ label }) => {
    const stats = aggregate.get(label) ?? { attempts: 0, correct: 0 };

    return {
      label,
      attempts: stats.attempts,
      correct: stats.correct,
      percent: stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : null,
      has_data: stats.attempts > 0,
    };
  });
}

export function buildCanonicalSummaryFromBreakdown(breakdown: CategoryBreakdownItem[]): CanonicalQuizSummary {
  const totalQuestions = breakdown.reduce((sum, item) => sum + item.attempts, 0);
  const correctAnswers = breakdown.reduce((sum, item) => sum + item.correct, 0);
  const scorePercent = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const ranked = breakdown
    .filter((item) => item.has_data)
    .sort((left, right) => (right.percent ?? 0) - (left.percent ?? 0));

  return {
    totalQuestions,
    correctAnswers,
    scorePercent,
    categoryBreakdown: breakdown,
    strongestArea: ranked[0]?.label,
    weakestArea: ranked[ranked.length - 1]?.label,
  };
}

export function buildSessionCategoryStatsRows(
  sessionId: string,
  breakdown: CategoryBreakdownItem[],
  syncedAt: string,
): SessionCategoryStatsRow[] {
  return CATEGORY_BREAKDOWN_ORDER.map(({ key, label }) => {
    const stats = breakdown.find((item) => item.label === label) ?? {
      label,
      attempts: 0,
      correct: 0,
      percent: null,
      has_data: false,
    };

    return {
      session_id: sessionId,
      category_key: key,
      category_label: label,
      attempts: stats.attempts,
      correct_answers: stats.correct,
      percent: stats.percent,
      has_data: stats.has_data,
      synced_at: syncedAt,
    };
  });
}

export async function upsertSessionCategoryStats(params: {
  supabase: SupabaseClient;
  sessionId: string;
  breakdown: CategoryBreakdownItem[];
  syncedAt: string;
}): Promise<{ error: unknown | null }> {
  const payload = buildSessionCategoryStatsRows(params.sessionId, params.breakdown, params.syncedAt);
  const result = await params.supabase
    .from("quiz_session_category_stats")
    .upsert(payload, { onConflict: "session_id,category_key" });

  return { error: result.error ?? null };
}

export async function fetchSessionCategoryStatsMap(params: {
  supabase: SupabaseClient;
  sessionIds: string[];
}): Promise<Map<string, CategoryBreakdownItem[]>> {
  const normalizedIds = params.sessionIds.filter((id, index, list) => id.length > 0 && list.indexOf(id) === index);

  if (normalizedIds.length === 0) {
    return new Map();
  }

  const result = await params.supabase
    .from("quiz_session_category_stats")
    .select("session_id, category_key, category_label, attempts, correct_answers, percent, has_data")
    .in("session_id", normalizedIds)
    .limit(Math.max(20, normalizedIds.length * CATEGORY_BREAKDOWN_ORDER.length));

  if (result.error || !Array.isArray(result.data) || result.data.length === 0) {
    return new Map();
  }

  const rowsBySession = new Map<string, CategoryBreakdownItem[]>();

  for (const rawEntry of result.data) {
    const row = asRecord(rawEntry);
    const sessionId = asText(row?.session_id);
    const label = normalizeCategoryLabel(asText(row?.category_label) || asText(row?.category_key));

    if (!sessionId || !label) {
      continue;
    }

    const current = rowsBySession.get(sessionId) ?? [];
    current.push({
      label,
      attempts: Math.max(0, asNullableNumber(row?.attempts) ?? 0),
      correct: Math.max(0, asNullableNumber(row?.correct_answers) ?? 0),
      percent: asNullableNumber(row?.percent),
      has_data: asBoolean(row?.has_data) || (asNullableNumber(row?.attempts) ?? 0) > 0,
    });
    rowsBySession.set(sessionId, current);
  }

  const normalizedMap = new Map<string, CategoryBreakdownItem[]>();

  for (const sessionId of normalizedIds) {
    const breakdown = rowsBySession.get(sessionId);

    if (!breakdown || breakdown.length === 0) {
      continue;
    }

    normalizedMap.set(
      sessionId,
      CATEGORY_BREAKDOWN_ORDER.map(({ label }) => {
        const stats = breakdown.find((item) => item.label === label) ?? {
          label,
          attempts: 0,
          correct: 0,
          percent: null,
          has_data: false,
        };

        return {
          label,
          attempts: stats.attempts,
          correct: stats.correct,
          percent: stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : null,
          has_data: stats.attempts > 0,
        };
      }),
    );
  }

  return normalizedMap;
}

export async function buildCanonicalCategoryBreakdownFromAnswers(params: {
  supabase: SupabaseClient;
  answers: QuizAnswerSnapshot[];
}): Promise<CategoryBreakdownItem[]> {
  const normalizedAnswers = params.answers.filter((answer) => answer.questionId.trim().length > 0);

  if (normalizedAnswers.length === 0) {
    return CATEGORY_BREAKDOWN_ORDER.map(({ label }) => ({
      label,
      attempts: 0,
      correct: 0,
      percent: null,
      has_data: false,
    }));
  }

  const questionIds = normalizedAnswers
    .map((answer) => answer.questionId.includes("::") ? answer.questionId.split("::")[0] ?? answer.questionId : answer.questionId)
    .filter((id, index, list) => id.length > 0 && list.indexOf(id) === index);

  const [exerciseResult, legacyQuestionResult] = await Promise.all([
    params.supabase
      .from("quiz_exercises")
      .select("id, category, task_type, payload")
      .in("id", questionIds)
      .limit(5000),
    params.supabase
      .from("quiz_questions")
      .select("id, category, mode")
      .in("id", questionIds)
      .limit(5000),
  ]);

  const categoryByQuestionId = new Map<string, string>();

  if (!exerciseResult.error && Array.isArray(exerciseResult.data)) {
    for (const rawEntry of exerciseResult.data) {
      const row = asRecord(rawEntry);
      const id = asText(row?.id);
      const payload = asRecord(row?.payload);
      const label = normalizeCategoryLabel(
        asText(payload?.category) || asText(row?.category) || asText(payload?.task_type) || asText(row?.task_type),
      );

      if (id && label) {
        categoryByQuestionId.set(id, label);
      }
    }
  }

  if (!legacyQuestionResult.error && Array.isArray(legacyQuestionResult.data)) {
    for (const rawEntry of legacyQuestionResult.data) {
      const row = asRecord(rawEntry);
      const id = asText(row?.id);
      const label = normalizeCategoryLabel(asText(row?.category) || asText(row?.mode));

      if (id && label && !categoryByQuestionId.has(id)) {
        categoryByQuestionId.set(id, label);
      }
    }
  }

  const aggregate = new Map<string, { attempts: number; correct: number }>();

  for (const answer of normalizedAnswers) {
    const questionId = answer.questionId.includes("::") ? answer.questionId.split("::")[0] ?? answer.questionId : answer.questionId;
    const label = categoryByQuestionId.get(questionId);

    if (!label) {
      continue;
    }

    const current = aggregate.get(label) ?? { attempts: 0, correct: 0 };
    current.attempts += 1;

    if (answer.isCorrect) {
      current.correct += 1;
    }

    aggregate.set(label, current);
  }

  return CATEGORY_BREAKDOWN_ORDER.map(({ label }) => {
    const stats = aggregate.get(label) ?? { attempts: 0, correct: 0 };

    return {
      label,
      attempts: stats.attempts,
      correct: stats.correct,
      percent: stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : null,
      has_data: stats.attempts > 0,
    };
  });
}
