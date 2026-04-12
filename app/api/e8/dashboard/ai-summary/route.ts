import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  AI_GENERATION_RATE_LIMIT_ACTION,
  buildRateLimitErrorPayload,
  enforceAiRateLimit,
} from "@/lib/ai/rate-limit";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import { getOpenAIServerClient } from "@/lib/openai/server";
import { getSupabaseUserClient } from "@/lib/supabase/server";

type SessionRow = {
  id: string;
  mode: string;
  status: string;
  scorePercent: number | null;
  correctAnswers: number | null;
  totalQuestions: number | null;
  completedAt: string | null;
  createdAt: string | null;
};

type GenericRecord = Record<string, unknown>;
type CachedSummary = {
  summary: string;
  sessionsUsed: number;
  generatedAt: string;
  refreshLockedUntil: string;
};

const USER_COLUMN_CANDIDATES = ["user_id", "profile_id", "owner_id", "student_id"] as const;
const SELECT_VARIANTS = [
  "id, mode, status, score_percent, correct_answers, total_questions, completed_at, created_at",
  "id, mode, status, score_percent, total_questions, completed_at, created_at",
  "id, mode, status, score_percent, completed_at, created_at",
  "id, mode, status, created_at",
] as const;
const AI_SUMMARY_REFRESH_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const AI_SUMMARY_CACHE = new Map<string, CachedSummary>();

function wantsRefresh(request: Request): boolean {
  try {
    const url = new URL(request.url);
    const raw = (url.searchParams.get("refresh") ?? "").trim().toLowerCase();
    return raw === "1" || raw === "true" || raw === "yes";
  } catch {
    return false;
  }
}

function isRefreshLocked(refreshLockedUntil: string): boolean {
  const unix = Date.parse(refreshLockedUntil);

  if (!Number.isFinite(unix)) {
    return false;
  }

  return unix > Date.now();
}

function refreshNotice(refreshLockedUntil: string): string {
  const unix = Date.parse(refreshLockedUntil);

  if (!Number.isFinite(unix)) {
    return "Odswiezysz raz na 24h.";
  }

  const lockDateTime = new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(unix));

  return `Mozesz odswiezyc ponownie: ${lockDateTime}.`;
}

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

function rowToSession(row: GenericRecord): SessionRow | null {
  const id = asText(row.id);

  if (!id) {
    return null;
  }

  return {
    id,
    mode: asText(row.mode) || "reactions",
    status: asText(row.status) || "unknown",
    scorePercent: asNullableNumber(row.score_percent),
    correctAnswers: asNullableNumber(row.correct_answers),
    totalQuestions: asNullableNumber(row.total_questions),
    completedAt: asNullableIso(row.completed_at),
    createdAt: asNullableIso(row.created_at),
  };
}

function sessionTimestamp(session: SessionRow): number {
  const candidate = session.completedAt ?? session.createdAt;

  if (!candidate) {
    return 0;
  }

  const unix = Date.parse(candidate);
  return Number.isFinite(unix) ? unix : 0;
}

function formatMode(mode: string): string {
  const normalized = mode.trim().toLowerCase();

  if (normalized === "reactions") {
    return "Reakcje";
  }

  if (normalized === "vocabulary") {
    return "Slownictwo";
  }

  if (normalized === "grammar") {
    return "Gramatyka";
  }

  return normalized.length > 0 ? normalized : "Reakcje";
}

async function fetchRecentSessions(accessToken: string, userId: string): Promise<SessionRow[]> {
  const supabase = getSupabaseUserClient(accessToken);

  for (const userColumn of USER_COLUMN_CANDIDATES) {
    let columnChecked = false;

    for (const selectFields of SELECT_VARIANTS) {
      const result = await supabase
        .from("quiz_sessions")
        .select(selectFields)
        .eq(userColumn, userId)
        .limit(30);

      if (!result.error && Array.isArray(result.data)) {
        columnChecked = true;

        const sessions = result.data
          .map((entry) => asRecord(entry))
          .filter((entry): entry is GenericRecord => entry !== null)
          .map((entry) => rowToSession(entry))
          .filter((entry): entry is SessionRow => entry !== null)
          .filter((session) => session.status === "completed" || session.scorePercent !== null)
          .sort((a, b) => sessionTimestamp(b) - sessionTimestamp(a))
          .slice(0, 5);

        if (sessions.length > 0) {
          return sessions;
        }

        break;
      }
    }

    if (columnChecked) {
      continue;
    }
  }

  return [];
}

function buildPrompt(sessions: SessionRow[]): string {
  const lines = sessions.map((session, index) => {
    const score =
      session.scorePercent !== null
        ? `${Math.round(session.scorePercent)}%`
        : session.correctAnswers !== null && session.totalQuestions !== null && session.totalQuestions > 0
          ? `${session.correctAnswers}/${session.totalQuestions}`
          : "brak wyniku";

    const when = session.completedAt ?? session.createdAt ?? "brak daty";

    return `${index + 1}. ${formatMode(session.mode)} | wynik: ${score} | data: ${when}`;
  });

  return [
    "Jestes przyjaznym nauczycielem angielskiego.",
    "Masz wyniki z ostatnich 5 sesji ucznia:",
    "",
    ...lines,
    "",
    "Napisz krotkie podsumowanie - maksymalnie 3 zdania.",
    "Jedno zdanie o tym, co idzie dobrze (konkretnie).",
    "Jedno zdanie o tym, gdzie sie potyka (konkretnie, z przykladem bledu).",
    "Jedno zdanie o tym, co powinien przecwiczyc dzis.",
    "",
    "Pisz cieplo, jak nauczyciel do ucznia, ktorego lubisz.",
    "Po polsku, bez formatowania i bez etykiet typu 'Trend:' czy 'Mocna strona:'.",
    "Tylko naturalny tekst, jak SMS.",
  ].join("\n");
}

export async function GET(request: Request) {
  const access = await resolveAccessTierFromRequest(request);

  if (!access.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (access.tier !== "premium" && access.tier !== "premium_plus") {
    return NextResponse.json(
      {
        error: "Funkcja AI jest dostepna tylko dla planu Uczen i Uczen+.",
      },
      { status: 403 },
    );
  }

  const refreshRequested = wantsRefresh(request);
  const cached = AI_SUMMARY_CACHE.get(access.userId);

  if (cached) {
    const locked = isRefreshLocked(cached.refreshLockedUntil);

    if (!refreshRequested || locked) {
      return NextResponse.json({
        ok: true,
        summary: cached.summary,
        sessionsUsed: cached.sessionsUsed,
        generatedAt: cached.generatedAt,
        refreshLockedUntil: cached.refreshLockedUntil,
        canRefreshNow: !locked,
        notice: locked ? refreshNotice(cached.refreshLockedUntil) : undefined,
      });
    }
  }

  if (!access.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await fetchRecentSessions(access.accessToken, access.userId);

  if (sessions.length === 0) {
    return NextResponse.json({
      ok: true,
      summary: "Ukoncz kilka sesji. Wtedy AI przygotuje krotkie podsumowanie trendu.",
      sessionsUsed: 0,
      generatedAt: new Date().toISOString(),
      refreshLockedUntil: null,
      canRefreshNow: true,
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error: "Brak konfiguracji OpenAI API.",
      },
      { status: 503 },
    );
  }

  try {
    const rateLimit = await enforceAiRateLimit({
      request,
      action: AI_GENERATION_RATE_LIMIT_ACTION,
      userId: access.userId,
      role: access.role,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(buildRateLimitErrorPayload(rateLimit), {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      });
    }

    const openai = getOpenAIServerClient();
    const prompt = buildPrompt(sessions);

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 15000);

    let response: { output_text?: string };

    try {
      response = await openai.responses.create(
        {
          model: "gpt-4o-mini",
          input: prompt,
          temperature: 0.2,
          max_output_tokens: 200,
        },
        { signal: timeoutController.signal },
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const summary = typeof response.output_text === "string" ? response.output_text.trim() : "";

    if (!summary) {
      return NextResponse.json(
        {
          error: "Brak odpowiedzi od AI.",
        },
        { status: 502 },
      );
    }

    const generatedAt = new Date().toISOString();
    const refreshLockedUntil = new Date(Date.now() + AI_SUMMARY_REFRESH_COOLDOWN_MS).toISOString();

    AI_SUMMARY_CACHE.set(access.userId, {
      summary,
      sessionsUsed: sessions.length,
      generatedAt,
      refreshLockedUntil,
    });

    return NextResponse.json({
      ok: true,
      summary,
      sessionsUsed: sessions.length,
      generatedAt,
      refreshLockedUntil,
      canRefreshNow: false,
      notice: refreshNotice(refreshLockedUntil),
    });
  } catch (error) {
    const isAbort = error instanceof DOMException && error.name === "AbortError";

    if (isAbort) {
      return NextResponse.json(
        {
          error: "Przekroczono czas oczekiwania na AI.",
        },
        { status: 504 },
      );
    }

    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          {
            error: "Przekroczono limit zapytan AI.",
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          error: "Usluga AI jest chwilowo niedostepna.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        error: "Nie udalo sie wygenerowac podsumowania AI.",
      },
      { status: 500 },
    );
  }
}



