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

const USER_COLUMN_CANDIDATES = ["user_id", "profile_id", "owner_id", "student_id"] as const;
const RECENT_ACTIVITY_LIMIT = 30;
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

  if (startedAt && completedAt) {
    const durationMs = Date.parse(completedAt) - Date.parse(startedAt);

    if (Number.isFinite(durationMs) && durationMs > 0) {
      durationMinutes = Math.round((durationMs / (1000 * 60)) * 10) / 10;
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
}): DashboardPayload {
  const { tier, role, rows } = params;
  const base = createEmptyPayload(tier, role);

  const sessions = rows
    .map((row) => buildSession(row))
    .filter((session): session is DashboardSession => session !== null)
    .sort((a, b) => sessionTimestamp(b) - sessionTimestamp(a));

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
      strongestMode: rankedModes[0]?.mode ?? null,
      weakestMode: rankedModes[rankedModes.length - 1]?.mode ?? null,
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
    const payload = buildPayload({
      tier: access.tier,
      role: access.role,
      rows,
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




