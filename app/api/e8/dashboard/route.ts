import { NextResponse } from "next/server";
import type { DashboardPayload, DashboardSession, DashboardSessionStatus } from "@/lib/quiz/dashboard-types";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import {
  getLockedSetsForTier,
  getSetAccessConfig,
  getSetsForTier,
  type AccessTier,
} from "@/lib/quiz/set-catalog";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { loadSetCatalogFromDatabase } from "@/lib/quiz/set-catalog-store";

type GenericRecord = Record<string, unknown>;

type ModeAggregate = {
  count: number;
  sumScore: number;
};

type TagSource = "grammar" | "vocabulary" | "skill";

type TagAggregate = {
  source: TagSource;
  raw: string;
  label: string;
  total: number;
  correct: number;
  accuracy: number;
};

type AnswerWindowAggregate = {
  firstUnix: number;
  lastUnix: number;
  count: number;
};

type SessionAnswerMetric = {
  sessionId: string;
  questionId: string;
  isCorrect: boolean;
  answeredAtUnix: number | null;
};

type AnswerAnalytics = {
  durationOverrides: Map<string, number | null>;
  answers: SessionAnswerMetric[];
};

const USER_COLUMN_CANDIDATES = ["user_id", "profile_id", "owner_id", "student_id"] as const;
const RECENT_ACTIVITY_LIMIT = 30;
const MAX_REASONABLE_SESSION_DURATION_MINUTES = 90;
const SELECT_VARIANTS = [
  "id, set_id, mode, status, total_questions, correct_answers, score_percent, completed_at, started_at, created_at",
  "id, set_id, mode, status, total_questions, correct_answers, score_percent, completed_at, created_at",
  "id, set_id, mode, status, score_percent, completed_at, created_at",
  "id, set_id, mode, status, created_at",
  "id, mode, status, total_questions, correct_answers, score_percent, completed_at, started_at, created_at",
  "id, mode, status, total_questions, correct_answers, score_percent, completed_at, created_at",
  "id, mode, status, score_percent, completed_at, created_at",
  "id, mode, status, created_at",
] as const;

function asRecord(value: unknown): GenericRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as GenericRecord;
}

function parseJsonLike(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) {
    return value;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  const parsed = parseJsonLike(value);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((entry) => asText(entry))
    .filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index);
}

function titleCaseTag(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  return normalized
    .split(" ")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function sameLabel(left: string | null, right: string | null): boolean {
  if (!left || !right) {
    return false;
  }

  const normalize = (value: string) => value.trim().toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ");
  return normalize(left) === normalize(right);
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

function asNullableIso(value: unknown): string | null {
  const text = asText(value);

  if (!text) {
    return null;
  }

  const unix = Date.parse(text);
  return Number.isFinite(unix) ? new Date(unix).toISOString() : null;
}

function asSessionStatus(value: unknown): DashboardSessionStatus {
  const text = asText(value).toLowerCase();

  if (text === "completed") {
    return "completed";
  }

  if (text === "in_progress") {
    return "in_progress";
  }

  return "unknown";
}

function scoreFromSession(session: DashboardSession): number | null {
  if (session.scorePercent !== null) {
    return session.scorePercent;
  }

  if (session.correctAnswers === null || session.totalQuestions === null || session.totalQuestions <= 0) {
    return null;
  }

  return Math.round((session.correctAnswers / session.totalQuestions) * 100);
}

function buildSession(row: GenericRecord): DashboardSession | null {
  const id = asText(row.id);

  if (!id) {
    return null;
  }

  const mode = asText(row.mode) || "reactions";
  const setId = asText(row.set_id) || null;
  const status = asSessionStatus(row.status);
  const startedAt = asNullableIso(row.started_at);
  const completedAt = asNullableIso(row.completed_at);
  const createdAt = asNullableIso(row.created_at);

  let durationMinutes: number | null = null;

  const durationStart = startedAt;

  if (durationStart && completedAt) {
    const durationMs = Date.parse(completedAt) - Date.parse(durationStart);

    if (Number.isFinite(durationMs) && durationMs > 0) {
      durationMinutes = sanitizeDurationMinutes(durationMs / (1000 * 60));
    }
  }

  return {
    id,
    mode,
    setId,
    status,
    scorePercent: asNullableNumber(row.score_percent),
    correctAnswers: asNullableNumber(row.correct_answers),
    totalQuestions: asNullableNumber(row.total_questions),
    startedAt,
    completedAt,
    createdAt,
    durationMinutes,
  };
}

async function fetchAnswerAnalytics(sessionIds: string[]): Promise<AnswerAnalytics> {
  const normalizedIds = sessionIds.filter((id, index, list) => id.length > 0 && list.indexOf(id) === index);

  if (normalizedIds.length === 0) {
    return {
      durationOverrides: new Map(),
      answers: [],
    };
  }

  let supabase: ReturnType<typeof getSupabaseServerClient>;

  try {
    supabase = getSupabaseServerClient();
  } catch {
    return {
      durationOverrides: new Map(),
      answers: [],
    };
  }

  const result = await supabase
    .from("quiz_session_answers")
    .select("session_id, question_id, is_correct, answered_at, created_at")
    .in("session_id", normalizedIds)
    .limit(5000);

  if (result.error || !Array.isArray(result.data) || result.data.length === 0) {
    return {
      durationOverrides: new Map(),
      answers: [],
    };
  }

  const aggregates = new Map<string, AnswerWindowAggregate>();
  const answers: SessionAnswerMetric[] = [];

  for (const rawEntry of result.data) {
    const entry = asRecord(rawEntry);

    if (!entry) {
      continue;
    }

    const sessionId = asText(entry.session_id);

    if (!sessionId) {
      continue;
    }

    const questionId = asText(entry.question_id);
    const isCorrect = entry.is_correct === true;
    const answeredAtIso = asNullableIso(entry.answered_at) ?? asNullableIso(entry.created_at);
    const answeredUnix = answeredAtIso ? Date.parse(answeredAtIso) : Number.NaN;
    const answeredAtUnix = Number.isFinite(answeredUnix) ? answeredUnix : null;

    if (questionId) {
      answers.push({
        sessionId,
        questionId,
        isCorrect,
        answeredAtUnix,
      });
    }

    if (answeredAtUnix === null) {
      continue;
    }

    const current = aggregates.get(sessionId);

    if (!current) {
      aggregates.set(sessionId, {
        firstUnix: answeredAtUnix,
        lastUnix: answeredAtUnix,
        count: 1,
      });
      continue;
    }

    current.firstUnix = Math.min(current.firstUnix, answeredAtUnix);
    current.lastUnix = Math.max(current.lastUnix, answeredAtUnix);
    current.count += 1;
    aggregates.set(sessionId, current);
  }

  const overrides = new Map<string, number | null>();

  for (const [sessionId, aggregate] of aggregates.entries()) {
    if (aggregate.count < 2) {
      overrides.set(sessionId, null);
      continue;
    }

    const durationMs = aggregate.lastUnix - aggregate.firstUnix;

    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      overrides.set(sessionId, null);
      continue;
    }

    overrides.set(sessionId, sanitizeDurationMinutes(durationMs / (1000 * 60)));
  }

  return {
    durationOverrides: overrides,
    answers,
  };
}

async function fetchTagPerformance(answerRows: SessionAnswerMetric[]): Promise<TagAggregate[]> {
  const questionIds = answerRows
    .map((entry) => entry.questionId)
    .filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index);

  if (questionIds.length === 0) {
    return [];
  }

  let supabase: ReturnType<typeof getSupabaseServerClient>;

  try {
    supabase = getSupabaseServerClient();
  } catch {
    return [];
  }

  const result = await supabase
    .from("quiz_exercises")
    .select("id, category, analytics, payload, grammar, vocabulary")
    .in("id", questionIds)
    .limit(5000);

  if (result.error || !Array.isArray(result.data) || result.data.length === 0) {
    return [];
  }

  const exerciseTags = new Map<
    string,
    {
      category: string;
      structures: string[];
      topic: string | null;
      skill: string | null;
      focusLabel: string | null;
    }
  >();

  for (const rawEntry of result.data) {
    const row = asRecord(rawEntry);

    if (!row) {
      continue;
    }

    const id = asText(row.id);

    if (!id) {
      continue;
    }

    const payload = asRecord(parseJsonLike(row.payload));
    const category = asText(payload?.category ?? row.category).toLowerCase();
    const analytics = asRecord(parseJsonLike(payload?.analytics ?? row.analytics));
    const grammar = asRecord(parseJsonLike(payload?.grammar ?? row.grammar));
    const vocabulary = asRecord(parseJsonLike(payload?.vocabulary ?? row.vocabulary));

    const structures = asStringArray(grammar?.structures);
    const topic = asText(vocabulary?.topic) || null;
    const skill = asText(analytics?.skill).toLowerCase() || null;
    const focusLabel = asText(analytics?.focus_label) || null;

    exerciseTags.set(id, {
      category,
      structures,
      topic,
      skill,
      focusLabel,
    });
  }

  const aggregates = new Map<string, TagAggregate>();

  const bump = (params: { source: TagSource; raw: string; isCorrect: boolean; label?: string | null }) => {
    const raw = params.raw.trim().toLowerCase();

    if (!raw) {
      return;
    }

    const key = `${params.source}:${raw}`;
    const current =
      aggregates.get(key) ??
      ({
        source: params.source,
        raw,
        label: params.label && params.label.trim().length > 0 ? params.label.trim() : titleCaseTag(raw),
        total: 0,
        correct: 0,
        accuracy: 0,
      } satisfies TagAggregate);

    current.total += 1;
    if (params.isCorrect) {
      current.correct += 1;
    }

    current.accuracy = current.total > 0 ? current.correct / current.total : 0;
    aggregates.set(key, current);
  };

  for (const answer of answerRows) {
    const tags = exerciseTags.get(answer.questionId);

    if (!tags) {
      continue;
    }

    if (tags.category === "reactions") {
      if (tags.skill) {
        bump({
          source: "skill",
          raw: tags.skill,
          label: tags.focusLabel,
          isCorrect: answer.isCorrect,
        });
      }
      continue;
    }

    if (tags.category === "vocabulary") {
      if (tags.topic) {
        bump({
          source: "vocabulary",
          raw: tags.topic,
          isCorrect: answer.isCorrect,
        });
      }
      continue;
    }

    if (tags.category === "grammar") {
      for (const structure of tags.structures) {
        bump({
          source: "grammar",
          raw: structure,
          isCorrect: answer.isCorrect,
        });
      }
      continue;
    }

    if (tags.category === "gap_fill_text") {
      for (const structure of tags.structures) {
        bump({
          source: "grammar",
          raw: structure,
          isCorrect: answer.isCorrect,
        });
      }

      if (tags.topic) {
        bump({
          source: "vocabulary",
          raw: tags.topic,
          isCorrect: answer.isCorrect,
        });
      }
      continue;
    }

    if (tags.category === "reading_mc") {
      if (tags.topic) {
        bump({
          source: "vocabulary",
          raw: tags.topic,
          isCorrect: answer.isCorrect,
        });
      }
      continue;
    }
  }

  return Array.from(aggregates.values());
}

function sessionTimestamp(session: DashboardSession): number {
  const candidate = session.completedAt ?? session.startedAt ?? session.createdAt;

  if (!candidate) {
    return 0;
  }

  const unix = Date.parse(candidate);
  return Number.isFinite(unix) ? unix : 0;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function sanitizeDurationMinutes(value: number | null): number | null {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  if (value > MAX_REASONABLE_SESSION_DURATION_MINUTES) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

function createEmptyPayload(tier: AccessTier, role: string | null): DashboardPayload {
  const config = getSetAccessConfig();

  return {
    tier,
    role,
    visibleSets: getSetsForTier(tier, config),
    lockedSets: getLockedSetsForTier(tier, config),
    recentSessions: [],
    stats: {
      sessionsStarted: 0,
      sessionsCompleted: 0,
      solvedQuestions: 0,
      averageScorePercent: null,
      averageDurationMinutes: null,
      strongestMode: null,
      weakestMode: null,
      lastScorePercent: null,
    },
  };
}

async function fetchRowsForUser(userId: string): Promise<GenericRecord[]> {
  let supabase: ReturnType<typeof getSupabaseServerClient>;

  try {
    supabase = getSupabaseServerClient();
  } catch {
    return [];
  }

  for (const userColumn of USER_COLUMN_CANDIDATES) {
    let columnChecked = false;

    for (const selectFields of SELECT_VARIANTS) {
      const result = await supabase
        .from("quiz_sessions")
        .select(selectFields)
        .eq(userColumn, userId)
        .limit(60);

      if (!result.error && Array.isArray(result.data)) {
        columnChecked = true;

        const rows = result.data
          .map((entry) => asRecord(entry))
          .filter((entry): entry is GenericRecord => entry !== null);

        if (rows.length > 0) {
          return rows;
        }

        // Column exists but this user has no rows here. Try next candidate column.
        break;
      }
    }

    if (columnChecked) {
      continue;
    }
  }

  return [];
}

function buildPayload(params: {
  tier: AccessTier;
  role: string | null;
  rows: GenericRecord[];
  answerDurationOverrides?: Map<string, number | null>;
  tagPerformance?: TagAggregate[];
}): DashboardPayload {
  const { tier, role, rows } = params;
  const base = createEmptyPayload(tier, role);

  const sessionsFromRows = rows
    .map((row) => buildSession(row))
    .filter((session): session is DashboardSession => session !== null)
    .sort((a, b) => sessionTimestamp(b) - sessionTimestamp(a));

  const overrides = params.answerDurationOverrides ?? new Map<string, number | null>();
  const sessions = sessionsFromRows.map((session) => {
    if (!overrides.has(session.id)) {
      return session;
    }

    return {
      ...session,
      durationMinutes: overrides.get(session.id) ?? null,
    };
  });

  if (sessions.length === 0) {
    return base;
  }

  const completedSessions = sessions.filter((session) => {
    if (session.status === "completed") {
      return true;
    }

    return session.completedAt !== null || scoreFromSession(session) !== null;
  });

  const scores = completedSessions
    .map((session) => scoreFromSession(session))
    .filter((score): score is number => score !== null);

  const durations = completedSessions
    .map((session) => session.durationMinutes)
    .filter((duration): duration is number => duration !== null);

  const solvedQuestions = completedSessions.reduce((sum, session) => {
    const total = session.totalQuestions ?? 0;
    return sum + (Number.isFinite(total) ? total : 0);
  }, 0);

  const modeAggregates = completedSessions.reduce<Record<string, ModeAggregate>>((accumulator, session) => {
    const score = scoreFromSession(session);

    if (score === null) {
      return accumulator;
    }

    const mode = session.mode || "reactions";
    const current = accumulator[mode] ?? { count: 0, sumScore: 0 };
    current.count += 1;
    current.sumScore += score;
    accumulator[mode] = current;
    return accumulator;
  }, {});

  const rankedModes = Object.entries(modeAggregates)
    .map(([mode, aggregate]) => ({
      mode,
      averageScore: aggregate.count > 0 ? aggregate.sumScore / aggregate.count : 0,
    }))
    .sort((a, b) => b.averageScore - a.averageScore);

  const rankedTags = (params.tagPerformance ?? [])
    .filter((item) => item.total > 0)
    .sort((a, b) => {
      if (b.accuracy !== a.accuracy) {
        return b.accuracy - a.accuracy;
      }

      return b.total - a.total;
    });

  const strongestTag = rankedTags[0] ?? null;
  const weakestTag = [...rankedTags].reverse().find((item) => !sameLabel(item.label, strongestTag?.label ?? null)) ?? null;

  const fallbackStrongestMode = rankedModes[0]?.mode ?? null;
  const fallbackWeakestMode = rankedModes[rankedModes.length - 1]?.mode ?? null;

  const strongestMetric: string | null = strongestTag?.label ?? fallbackStrongestMode ?? null;
  let weakestMetric: string | null = weakestTag?.label ?? fallbackWeakestMode ?? null;

  if (sameLabel(strongestMetric, weakestMetric)) {
    const alternateTag =
      rankedTags.find((tag) => !sameLabel(tag.label, strongestMetric))?.label ?? null;
    const alternateMode =
      rankedModes
        .map((entry) => entry.mode)
        .find((mode) => !sameLabel(mode, strongestMetric)) ?? null;

    if (alternateTag) {
      weakestMetric = alternateTag;
    } else if (alternateMode) {
      weakestMetric = alternateMode;
    }
  }

  if (!weakestMetric && strongestMetric) {
    weakestMetric = strongestMetric;
  }

  const recentSessions = sessions.slice(0, RECENT_ACTIVITY_LIMIT);
  const lastCompleted = completedSessions[0] ?? null;

  return {
    ...base,
    recentSessions,
    stats: {
      sessionsStarted: sessions.length,
      sessionsCompleted: completedSessions.length,
      solvedQuestions,
      averageScorePercent: average(scores),
      averageDurationMinutes: average(durations),
      strongestMode: strongestMetric ?? null,
      weakestMode: weakestMetric ?? null,
      lastScorePercent: lastCompleted ? scoreFromSession(lastCompleted) : null,
    },
  };
}

export async function GET(request: Request) {
  const access = await resolveAccessTierFromRequest(request);
  await loadSetCatalogFromDatabase();

  if (!access.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await fetchRowsForUser(access.userId);
    const sortedSessionIds = rows
      .map((row) => buildSession(row))
      .filter((session): session is DashboardSession => session !== null)
      .sort((a, b) => sessionTimestamp(b) - sessionTimestamp(a))
      .filter((session) => {
        if (session.status === "completed") {
          return true;
        }

        return session.completedAt !== null || scoreFromSession(session) !== null;
      })
      .map((session) => session.id)
      .filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index)
      .slice(0, RECENT_ACTIVITY_LIMIT);
    const answerAnalytics = await fetchAnswerAnalytics(sortedSessionIds);
    const tagPerformance = await fetchTagPerformance(answerAnalytics.answers);
    const payload = buildPayload({
      tier: access.tier,
      role: access.role,
      rows,
      answerDurationOverrides: answerAnalytics.durationOverrides,
      tagPerformance,
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    const fallback = createEmptyPayload(access.tier, access.role);

    return NextResponse.json(
      {
        ...fallback,
        details: message,
      },
      { status: 200 },
    );
  }
}




