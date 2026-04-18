import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  AI_GENERATION_RATE_LIMIT_ACTION,
  buildRateLimitErrorPayload,
  enforceAiRateLimit,
} from "@/lib/ai/rate-limit";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import {
  aggregateCategoryBreakdowns,
  fetchSessionCategoryStatsMap,
} from "@/lib/quiz/session-category-stats";
import { extractChatCompletionText, getOpenAIServerClient, logOpenAIBackendError } from "@/lib/openai/server";
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
  categoryBreakdown: CategoryBreakdownItem[];
  sessionsUsed: number;
  sessionSignature: string;
  generatedAt: string;
  refreshLockedUntil: string;
};

type CategoryBreakdownItem = {
  label: string;
  percent: number | null;
};

type PromptCategoryBreakdownItem = CategoryBreakdownItem & {
  attempts: number;
  correct: number;
  has_data: boolean;
};

type SummarySessionStats = {
  averageScorePercent: number | null;
  bestScorePercent: number | null;
  bestSessionMode: string | null;
};

type PromptCategoryInsight = {
  strongest: string | null;
  weakest: string | null;
  additionalWork: string[];
};

type ProgressInsight = {
  trend: "improving" | "declining" | "stable" | "insufficient_data";
  summary: string;
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

type SessionAnswerMetric = {
  sessionId: string;
  questionId: string;
  isCorrect: boolean;
  answeredAtUnix: number | null;
};

type ConcreteAreasInsight = {
  strongestAreas: string[];
  weakestAreas: string[];
  additionalWorkAreas: string[];
};

const CATEGORY_BREAKDOWN_ORDER = [
  { mode: "reactions", label: "Reactions" },
  { mode: "vocabulary", label: "Vocabulary" },
  { mode: "grammar", label: "Grammar" },
  { mode: "reading_mc", label: "Reading MC" },
] as const;

type AiSummaryJson = {
  headline?: string;
  summary?: string;
  category_breakdown?: Array<{
    label?: string;
    percent?: number | null;
  }>;
  strengths?: string[];
  focus_areas?: string[];
  next_step?: string;
};

const USER_COLUMN_CANDIDATES = ["user_id", "profile_id", "owner_id", "student_id"] as const;
const SELECT_VARIANTS = [
  "id, mode, status, score_percent, correct_answers, total_questions, completed_at, created_at",
  "id, mode, status, score_percent, total_questions, completed_at, created_at",
  "id, mode, status, score_percent, completed_at, created_at",
  "id, mode, status, created_at",
] as const;
const AI_SUMMARY_REFRESH_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const AI_SUMMARY_CACHE_VERSION = 3;
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

function isRateLimitInfrastructureUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("public.rate_limits") && message.includes("schema cache")
  ) || message.includes("Missing SUPABASE_SERVICE_ROLE_KEY for admin client");
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
  const normalized = normalizeCategoryLabel(mode);
  return normalized ?? (mode.trim().toLowerCase() || "Reactions");
}

function buildSessionsJson(sessions: SessionRow[]) {
  return sessions.map((session) => {
    const modes = parseModes(session.mode);
    const modeLabel =
      modes.length > 1
        ? modes.map(formatMode).join(", ")
        : formatMode(modes[0] ?? session.mode);

    return {
      id: session.id,
      mode: modeLabel,
      status: session.status,
      score_percent: session.scorePercent,
      correct_answers: session.correctAnswers,
      total_questions: session.totalQuestions,
      completed_at: session.completedAt,
      created_at: session.createdAt,
    };
  });
}

function scoreFromSession(session: SessionRow): number | null {
  if (session.totalQuestions !== null && session.totalQuestions > 0 && session.correctAnswers !== null) {
    return Math.round((session.correctAnswers / session.totalQuestions) * 100);
  }

  if (session.totalQuestions !== null && session.totalQuestions > 0 && session.scorePercent !== null) {
    return session.scorePercent;
  }

  return null;
}

function hasMeaningfulSessionData(session: SessionRow): boolean {
  return scoreFromSession(session) !== null;
}

function parseModes(mode: string): string[] {
  const normalized = mode.trim().toLowerCase();

  if (normalized.startsWith("mixed:")) {
    return normalized
      .slice("mixed:".length)
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);
  }

  return normalized.length > 0 ? [normalized] : [];
}

function normalizeCategoryLabel(value: string): string | null {
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

function toPlainCategoryBreakdown(items: PromptCategoryBreakdownItem[]): CategoryBreakdownItem[] {
  return items.map(({ label, percent }) => ({ label, percent }));
}

function buildSummarySessionStats(sessions: SessionRow[]): SummarySessionStats {
  const scored = sessions
    .map((session) => ({ score: scoreFromSession(session), mode: formatMode(session.mode) }))
    .filter((entry): entry is { score: number; mode: string } => entry.score !== null);

  if (scored.length === 0) {
    return {
      averageScorePercent: null,
      bestScorePercent: null,
      bestSessionMode: null,
    };
  }

  const averageScorePercent = Math.round(scored.reduce((sum, entry) => sum + entry.score, 0) / scored.length);
  const best = scored.reduce((currentBest, entry) => (entry.score > currentBest.score ? entry : currentBest), scored[0]);

  return {
    averageScorePercent,
    bestScorePercent: best.score,
    bestSessionMode: best.mode,
  };
}

function buildDeterministicSummary(items: PromptCategoryBreakdownItem[]): string {
  const withData = items.filter((item) => item.has_data);

  if (withData.length === 0) {
    return "W ostatnich sesjach brakuje jeszcze szczegolowych danych o odpowiedziach w kategoriach.";
  }

  const positive = withData
    .filter((item) => item.correct > 0)
    .sort((left, right) => (right.percent ?? 0) - (left.percent ?? 0));

  if (positive.length === 0) {
    return `W ostatnich sesjach odpowiedzi pojawily sie w ${withData.map((item) => item.label).join(", ")}, ale bez poprawnych trafien w tych kategoriach.`;
  }

  const lead = positive[0];
  const alsoPositive = positive.filter((item) => item.label !== lead.label);
  const stalled = withData.filter((item) => item.correct === 0);
  const leadDetails =
    lead.attempts > 0
      ? `${lead.label} (${lead.percent}% - ${lead.correct}/${lead.attempts})`
      : `${lead.label} (${lead.percent}%)`;

  if (alsoPositive.length === 0 && stalled.length === 0) {
    return `W ostatnich sesjach najlepiej wypadla kategoria ${leadDetails}.`;
  }

  const positiveText = [leadDetails, ...alsoPositive.map((item) => `${item.label} (${item.percent}% - ${item.correct}/${item.attempts})`)].join(", ");

  if (stalled.length === 0) {
    return `W ostatnich sesjach poprawne odpowiedzi pojawily sie w ${positiveText}.`;
  }

  return `W ostatnich sesjach poprawne odpowiedzi pojawily sie w ${positiveText}, a bez trafien pozostaly ${stalled.map((item) => item.label).join(", ")}.`;
}

function buildCategoryBreakdownFromSessionScores(sessions: SessionRow[]): PromptCategoryBreakdownItem[] {
  const grouped = new Map<string, { totalPercent: number; count: number }>();

  for (const session of sessions) {
    const score = scoreFromSession(session);

    if (score === null || !Number.isFinite(score)) {
      continue;
    }

    for (const rawMode of parseModes(session.mode)) {
      const label = normalizeCategoryLabel(rawMode);

      if (!label) {
        continue;
      }

      const current = grouped.get(label) ?? { totalPercent: 0, count: 0 };
      current.totalPercent += score;
      current.count += 1;
      grouped.set(label, current);
    }
  }

  return CATEGORY_BREAKDOWN_ORDER.map(({ label }) => {
    const stats = grouped.get(label);

    if (!stats || stats.count <= 0) {
      return {
        label,
        attempts: 0,
        correct: 0,
        has_data: false,
        percent: null,
      };
    }

    return {
      label,
      attempts: stats.count,
      correct: 0,
      has_data: true,
      percent: Math.round(stats.totalPercent / stats.count),
    };
  });
}

async function fetchAnswerAnalytics(
  accessToken: string,
  sessionIds: string[],
): Promise<SessionAnswerMetric[]> {
  const normalizedIds = sessionIds.filter((id, index, list) => id.length > 0 && list.indexOf(id) === index);

  if (normalizedIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseUserClient(accessToken);
  const result = await supabase
    .from("quiz_session_answers")
    .select("session_id, question_id, is_correct, answered_at, created_at")
    .in("session_id", normalizedIds)
    .limit(5000);

  if (result.error || !Array.isArray(result.data) || result.data.length === 0) {
    return [];
  }

  const answers: SessionAnswerMetric[] = [];

  for (const rawEntry of result.data) {
    const entry = asRecord(rawEntry);

    if (!entry) {
      continue;
    }

    const sessionId = asText(entry.session_id);
    const questionId = asText(entry.question_id);

    if (!sessionId || !questionId) {
      continue;
    }

    const answeredAtIso = asNullableIso(entry.answered_at) ?? asNullableIso(entry.created_at);
    const answeredUnix = answeredAtIso ? Date.parse(answeredAtIso) : Number.NaN;

    answers.push({
      sessionId,
      questionId,
      isCorrect: entry.is_correct === true,
      answeredAtUnix: Number.isFinite(answeredUnix) ? answeredUnix : null,
    });
  }

  return answers;
}

async function fetchTagPerformance(
  accessToken: string,
  answerRows: SessionAnswerMetric[],
): Promise<TagAggregate[]> {
  const questionIds = answerRows
    .map((entry) => (entry.questionId.includes("::") ? entry.questionId.split("::")[0] ?? entry.questionId : entry.questionId))
    .filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index);

  if (questionIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseUserClient(accessToken);
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

    exerciseTags.set(id, {
      category,
      structures: asStringArray(grammar?.structures),
      topic: asText(vocabulary?.topic) || null,
      skill: asText(analytics?.skill).toLowerCase() || null,
      focusLabel: asText(analytics?.focus_label) || null,
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
    const exerciseId = answer.questionId.includes("::") ? answer.questionId.split("::")[0] ?? answer.questionId : answer.questionId;
    const tags = exerciseTags.get(exerciseId);

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

    if (tags.category === "vocabulary" || tags.category === "reading_mc") {
      if (tags.topic) {
        bump({
          source: "vocabulary",
          raw: tags.topic,
          isCorrect: answer.isCorrect,
        });
      }
      continue;
    }

    if (tags.category === "grammar" || tags.category === "gap_fill_text") {
      for (const structure of tags.structures) {
        bump({
          source: "grammar",
          raw: structure,
          isCorrect: answer.isCorrect,
        });
      }

      if (tags.category === "gap_fill_text" && tags.topic) {
        bump({
          source: "vocabulary",
          raw: tags.topic,
          isCorrect: answer.isCorrect,
        });
      }
    }
  }

  return Array.from(aggregates.values());
}

function formatCategoryLabelForStudent(label: string): string {
  switch (label) {
    case "Reactions":
      return "reakcje jezykowe";
    case "Vocabulary":
      return "slownictwo";
    case "Grammar":
      return "gramatyka";
    case "Reading MC":
      return "czytanie";
    default:
      return label.toLowerCase();
  }
}

function formatTagSourceLabel(source: TagSource): string {
  switch (source) {
    case "grammar":
      return "struktura gramatyczna";
    case "vocabulary":
      return "temat slownictwa";
    case "skill":
      return "typ reakcji";
    default:
      return "obszar";
  }
}

function buildConcreteAreasInsight(tagPerformance: TagAggregate[]): ConcreteAreasInsight {
  const ranked = tagPerformance
    .filter((item) => item.total > 0)
    .sort((left, right) => {
      if (right.accuracy !== left.accuracy) {
        return right.accuracy - left.accuracy;
      }

      return right.total - left.total;
    });

  const strongestAreas = ranked
    .filter((item) => item.accuracy >= 0.65)
    .slice(0, 3)
    .map((item) => `${item.label} (${formatTagSourceLabel(item.source)}, ${Math.round(item.accuracy * 100)}%)`);

  const weakestAreas = [...ranked]
    .reverse()
    .filter((item) => item.accuracy < 0.65)
    .slice(0, 3)
    .map((item) => `${item.label} (${formatTagSourceLabel(item.source)}, ${Math.round(item.accuracy * 100)}%)`);

  const additionalWorkAreas = [...ranked]
    .reverse()
    .filter((item) => item.accuracy < 0.75)
    .slice(0, 5)
    .map((item) => `${item.label} (${formatTagSourceLabel(item.source)})`);

  return {
    strongestAreas,
    weakestAreas,
    additionalWorkAreas,
  };
}

function buildPromptCategoryInsight(categoryBreakdown: PromptCategoryBreakdownItem[]): PromptCategoryInsight {
  const withData = categoryBreakdown
    .filter((item) => item.has_data && item.percent !== null)
    .sort((left, right) => (right.percent ?? 0) - (left.percent ?? 0));

  if (withData.length === 0) {
    return {
      strongest: null,
      weakest: null,
      additionalWork: [],
    };
  }

  const strongest = withData[0]
    ? `${formatCategoryLabelForStudent(withData[0].label)} (${withData[0].percent}%)`
    : null;
  const weakestSource = withData[withData.length - 1] ?? null;
  const weakest = weakestSource
    ? `${formatCategoryLabelForStudent(weakestSource.label)} (${weakestSource.percent}%)`
    : null;
  const additionalWork = withData
    .filter((item) => (item.percent ?? 0) < 65)
    .map((item) => `${formatCategoryLabelForStudent(item.label)} (${item.percent}%)`);

  return {
    strongest,
    weakest,
    additionalWork,
  };
}

function buildProgressInsight(sessions: SessionRow[]): ProgressInsight {
  const scores = sessions
    .map((session) => scoreFromSession(session))
    .filter((score): score is number => score !== null && Number.isFinite(score));

  if (scores.length < 3) {
    return {
      trend: "insufficient_data",
      summary: "Za malo zakonczonych sesji, zeby uczciwie ocenic trend postepu.",
    };
  }

  const recent = scores.slice(0, 2);
  const previous = scores.slice(2, 4);

  if (previous.length === 0) {
    return {
      trend: "insufficient_data",
      summary: "Za malo starszych sesji, zeby porownac postep.",
    };
  }

  const recentAverage = Math.round(recent.reduce((sum, value) => sum + value, 0) / recent.length);
  const previousAverage = Math.round(previous.reduce((sum, value) => sum + value, 0) / previous.length);
  const delta = recentAverage - previousAverage;

  if (delta >= 8) {
    return {
      trend: "improving",
      summary: `Widoczna poprawa: ostatnie sesje sa srednio o ${delta} punktow procentowych lepsze niz kilka zestawow wstecz.`,
    };
  }

  if (delta <= -8) {
    return {
      trend: "declining",
      summary: `Widoczny spadek: ostatnie sesje sa srednio o ${Math.abs(delta)} punktow procentowych slabsze niz kilka zestawow wstecz.`,
    };
  }

  return {
    trend: "stable",
    summary: "Wyniki trzymaja podobny poziom wzgledem kilku zestawow wstecz.",
  };
}

function buildPrompts(
  sessions: SessionRow[],
  categoryBreakdown: PromptCategoryBreakdownItem[],
  stats: SummarySessionStats,
  concreteAreas: ConcreteAreasInsight,
) {
  const categoryInsight = buildPromptCategoryInsight(categoryBreakdown);
  const progressInsight = buildProgressInsight(sessions);

  const systemPrompt = `Jestes analitycznym asystentem edukacyjnym dla ucznia przygotowujacego sie do egzaminu osmoklasisty z angielskiego.

Masz przygotowac krotkie, konkretne i naturalnie brzmiace podsumowanie ostatnich sesji nauki.
Brzmisz jak dobry nauczyciel, ktory widzi realny postep ucznia i umie pokazac, co jeszcze poprawic przed egzaminem.

Zasady:
- opieraj sie wylacznie na dostarczonych danych
- nie wymyslaj trendow, bledow ani mocnych stron, jesli nie wynikaja z danych
- nie uzywaj ogolnikow typu "cwicz dalej", "jest dobrze", "musisz sie postarac"
- nie brzmisz jak coach ani raport korporacyjny
- pisz jasno, prosto i po ludzku
- ton ma byc wspierajacy, ale rzeczowy
- jesli dane pokazuja postep, koniecznie go nazwij i docen
- jesli dane nie pokazuja postepu, nie udawaj go
- mow o konkretnych obszarach: reakcje jezykowe, slownictwo, gramatyka, czytanie
- nie uzywaj markdownu
- zwroc wylacznie poprawny JSON
- jesli danych jest malo albo sa niespojne, zaznacz to wprost

Priorytet:
1. krotko opisz, co widac
2. nazwij najmocniejszy obszar ucznia
3. nazwij najslabszy obszar ucznia
4. jesli w danych widac poprawe wzgledem kilku starszych zestawow, powiedz to wprost
5. zaproponuj jeden sensowny nastepny krok`;

  const userPrompt = `Na podstawie danych z ostatnich sesji ucznia przygotuj krotkie podsumowanie.

Dane:
${JSON.stringify(
    {
      last_sessions: buildSessionsJson(sessions),
      category_breakdown: categoryBreakdown,
      teacher_notes: {
        strongest_area: categoryInsight.strongest,
        weakest_area: categoryInsight.weakest,
        additional_work_areas: categoryInsight.additionalWork,
        progress_signal: progressInsight,
        strongest_specific_areas: concreteAreas.strongestAreas,
        weakest_specific_areas: concreteAreas.weakestAreas,
        additional_specific_areas: concreteAreas.additionalWorkAreas,
      },
      stats: {
        sessions_considered: sessions.length,
        average_score_percent: stats.averageScorePercent,
        best_score_percent: stats.bestScorePercent,
        best_session_mode: stats.bestSessionMode,
      },
    },
    null,
    2,
  )}

Zwroc dokladnie taki JSON:
{
  "headline": "krotki tytul, maksymalnie 7 slow",
  "summary": "2-3 konkretne zdania o tym, co widac po ostatnich sesjach",
  "strengths": [
    "krotka i konkretna mocna strona",
    "krotka i konkretna mocna strona"
  ],
  "focus_areas": [
    "krotki i konkretny obszar do poprawy",
    "krotki i konkretny obszar do poprawy"
  ],
  "next_step": "jedna konkretna rzecz do zrobienia na nastepnej sesji",
  "category_breakdown": [
    { "label": "Reactions", "percent": 67 },
    { "label": "Vocabulary", "percent": 0 },
    { "label": "Grammar", "percent": 0 },
    { "label": "Reading MC", "percent": 0 }
  ]
}

Dodatkowe reguly:
- uzywaj nazw kategorii lub typow zadan, jesli sa w danych
- jesli nie da sie uczciwie wskazac 2 mocnych stron albo 2 obszarow do poprawy, nie wymyslaj ich na sile
- "next_step" ma byc maly, praktyczny i natychmiastowy
- "summary" ma brzmiec naturalnie, nie sztucznie
- "summary" powinno brzmiec jak nauczycielskie podsumowanie dla ucznia, np. w duchu:
  najmocniejszy obszar, najslabszy obszar, dodatkowe rzeczy do dopracowania, realny postep jesli jest widoczny
- jesli "teacher_notes.strongest_specific_areas" albo "teacher_notes.weakest_specific_areas" zawiera konkretne obszary, uzyj ich w summary zamiast zostawac na poziomie samej kategorii
- jesli w danych sa konkretne struktury gramatyczne, tematy slownictwa albo typy reakcji, nazwij je wprost
- jesli "teacher_notes.progress_signal.trend" to "improving", zaznacz wyraznie, ze widac poprawa wzgledem kilku starszych zestawow
- jesli "teacher_notes.additional_specific_areas" nie jest puste, nazwij 2-3 takie obszary w summary albo next_step
- uczen ma po przeczytaniu wiedziec CO konkretnie idzie dobrze i CO konkretnie wymaga jeszcze pracy
- unikaj zdan typu "najmocniej widac to tutaj", "najwiekszy progres", "dobrym ruchem bedzie", jesli nie sa naprawde uzasadnione danymi
- "category_breakdown" ma zawsze zawierac 4 pozycje w tej kolejnosci: Reactions, Vocabulary, Grammar, Reading MC
- jezeli "category_breakdown" pokazuje dane w kategorii, summary musi byc z nim zgodne
- jezli dla kategorii nie ma danych, ustaw "percent" na null`;

  return { systemPrompt, userPrompt };
}

function normalizeCategoryBreakdown(raw: unknown, fallback: CategoryBreakdownItem[]): CategoryBreakdownItem[] {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  const normalizedMap = new Map(
    raw
      .map((entry) => ({
        label: typeof entry?.label === "string" ? entry.label.trim().toLowerCase() : "",
        percent: typeof entry?.percent === "number" && Number.isFinite(entry.percent) ? Math.round(entry.percent) : null,
      }))
      .filter((entry) => entry.label.length > 0)
      .map((entry) => [entry.label, entry.percent] as const),
  );

  return CATEGORY_BREAKDOWN_ORDER.map(({ label }) => ({
    label,
    percent: normalizedMap.has(label.toLowerCase())
      ? normalizedMap.get(label.toLowerCase()) ?? null
      : fallback.find((item) => item.label === label)?.percent ?? null,
  }));
}

function normalizeSummaryPayload(raw: string, fallbackBreakdown: CategoryBreakdownItem[]) {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { summary: "", categoryBreakdown: fallbackBreakdown };
  }

  try {
    const parsed = JSON.parse(trimmed) as AiSummaryJson;
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
      categoryBreakdown: normalizeCategoryBreakdown(parsed.category_breakdown, fallbackBreakdown),
    };
  } catch {
    return {
      summary: trimmed,
      categoryBreakdown: fallbackBreakdown,
    };
  }
}

async function fetchDerivedScores(
  accessToken: string,
  sessionIds: string[],
): Promise<Map<string, { totalQuestions: number; correctAnswers: number; scorePercent: number }>> {
  const normalizedIds = sessionIds.filter((id, index, list) => id.length > 0 && list.indexOf(id) === index);

  if (normalizedIds.length === 0) {
    return new Map();
  }

  const supabase = getSupabaseUserClient(accessToken);
  const result = await supabase
    .from("quiz_session_answers")
    .select("session_id, is_correct")
    .in("session_id", normalizedIds)
    .limit(5000);

  if (result.error || !Array.isArray(result.data) || result.data.length === 0) {
    return new Map();
  }

  const agg = new Map<string, { total: number; correct: number }>();

  for (const rawRow of result.data) {
    const row = asRecord(rawRow);
    const sessionId = asText(row?.session_id);

    if (!sessionId) {
      continue;
    }

    const current = agg.get(sessionId) ?? { total: 0, correct: 0 };
    current.total += 1;

    if (row?.is_correct === true) {
      current.correct += 1;
    }

    agg.set(sessionId, current);
  }

  const derived = new Map<string, { totalQuestions: number; correctAnswers: number; scorePercent: number }>();

  for (const [sessionId, counts] of agg.entries()) {
    if (counts.total <= 0) {
      continue;
    }

    derived.set(sessionId, {
      totalQuestions: counts.total,
      correctAnswers: counts.correct,
      scorePercent: Math.round((counts.correct / counts.total) * 100),
    });
  }

  return derived;
}

function buildSessionSignature(sessions: SessionRow[], categoryBreakdown: PromptCategoryBreakdownItem[]): string {
  return JSON.stringify(
    {
      version: AI_SUMMARY_CACHE_VERSION,
      sessions: sessions.map((session) => ({
        id: session.id,
        mode: session.mode,
        status: session.status,
        scorePercent: session.scorePercent,
        correctAnswers: session.correctAnswers,
        totalQuestions: session.totalQuestions,
        completedAt: session.completedAt,
        createdAt: session.createdAt,
      })),
      categoryBreakdown,
    },
  );
}

async function fetchSessionStats(
  accessToken: string,
  sessionIds: string[],
): Promise<Map<string, { totalQuestions: number | null; correctAnswers: number | null; scorePercent: number | null; syncedAt: string | null }>> {
  const normalizedIds = sessionIds.filter((id, index, list) => id.length > 0 && list.indexOf(id) === index);

  if (normalizedIds.length === 0) {
    return new Map();
  }

  const supabase = getSupabaseUserClient(accessToken);
  const result = await supabase
    .from("quiz_result_stats")
    .select("session_id, total_questions, correct_answers, score_percent, synced_at")
    .in("session_id", normalizedIds)
    .limit(5000);

  if (result.error || !Array.isArray(result.data) || result.data.length === 0) {
    return new Map();
  }

  const stats = new Map<string, { totalQuestions: number | null; correctAnswers: number | null; scorePercent: number | null; syncedAt: string | null }>();

  for (const rawEntry of result.data) {
    const entry = asRecord(rawEntry);
    const sessionId = asText(entry?.session_id);

    if (!sessionId) {
      continue;
    }

    stats.set(sessionId, {
      totalQuestions: asNullableNumber(entry?.total_questions),
      correctAnswers: asNullableNumber(entry?.correct_answers),
      scorePercent: asNullableNumber(entry?.score_percent),
      syncedAt: asNullableIso(entry?.synced_at),
    });
  }

  return stats;
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

        const rows = result.data
          .map((entry) => asRecord(entry))
          .filter((entry): entry is GenericRecord => entry !== null);

        const sessionIds = rows
          .map((entry) => asText(entry.id))
          .filter((id, index, list) => id.length > 0 && list.indexOf(id) === index);

        const [statsBySessionId, derivedScores] = await Promise.all([
          fetchSessionStats(accessToken, sessionIds),
          fetchDerivedScores(accessToken, sessionIds),
        ]);

        const sessions = rows
          .map((entry) => {
            const sessionId = asText(entry.id);
            const stats = sessionId ? statsBySessionId.get(sessionId) : null;
            const derived = sessionId ? derivedScores.get(sessionId) : null;

            return rowToSession({
              ...entry,
              total_questions: derived?.totalQuestions ?? entry.total_questions ?? stats?.totalQuestions,
              correct_answers: derived?.correctAnswers ?? entry.correct_answers ?? stats?.correctAnswers,
              score_percent: derived?.scorePercent ?? entry.score_percent ?? stats?.scorePercent,
              completed_at: entry.completed_at ?? stats?.syncedAt,
              status:
                derived || entry.completed_at || stats?.syncedAt || entry.score_percent !== undefined || stats?.scorePercent !== null
                  ? "completed"
                  : entry.status,
            });
          })
          .filter((entry): entry is SessionRow => entry !== null)
          .filter((session) => hasMeaningfulSessionData(session))
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

  if (!access.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await fetchRecentSessions(access.accessToken, access.userId);
  const answerAnalytics = await fetchAnswerAnalytics(
    access.accessToken,
    sessions.map((session) => session.id),
  );
  const tagPerformance = await fetchTagPerformance(access.accessToken, answerAnalytics);
  const categoryBreakdownBySession = await fetchSessionCategoryStatsMap({
    supabase: getSupabaseUserClient(access.accessToken),
    sessionIds: sessions.map((session) => session.id),
  });
  const persistedBreakdownItems = Array.from(categoryBreakdownBySession.values()).flat();
  const fallbackBreakdownDetailed =
    persistedBreakdownItems.length > 0
      ? aggregateCategoryBreakdowns(persistedBreakdownItems)
      : buildCategoryBreakdownFromSessionScores(sessions);
  const summaryStats = buildSummarySessionStats(sessions);
  const debugPayload = {
    sessionsConsidered: sessions.map((session) => ({
      id: session.id,
      mode: session.mode,
      scorePercent: session.scorePercent,
      correctAnswers: session.correctAnswers,
      totalQuestions: session.totalQuestions,
    })),
    sessionCategoryBreakdowns: sessions.map((session) => ({
      sessionId: session.id,
      categoryBreakdown: categoryBreakdownBySession.get(session.id) ?? [],
    })),
    fallbackBreakdownDetailed,
    tagPerformance,
    summaryStats,
  };
  console.log("[ai-summary] Aggregated categories", JSON.stringify(debugPayload, null, 2));
  const fallbackBreakdown = toPlainCategoryBreakdown(fallbackBreakdownDetailed);
  const sessionSignature = buildSessionSignature(sessions, fallbackBreakdownDetailed);
  const cached = AI_SUMMARY_CACHE.get(access.userId);

  if (cached) {
    const locked = isRefreshLocked(cached.refreshLockedUntil);
    const normalizedCachedBreakdown = normalizeCategoryBreakdown(
      cached.categoryBreakdown,
      CATEGORY_BREAKDOWN_ORDER.map(({ label }) => ({ label, percent: null })),
    );

    if (cached.sessionSignature === sessionSignature && (!refreshRequested || locked)) {
      return NextResponse.json({
        ok: true,
        summary: cached.summary,
        category_breakdown: normalizedCachedBreakdown,
        debug: debugPayload,
        sessionsUsed: cached.sessionsUsed,
        generatedAt: cached.generatedAt,
        refreshLockedUntil: cached.refreshLockedUntil,
        canRefreshNow: !locked,
        notice: locked ? refreshNotice(cached.refreshLockedUntil) : undefined,
      });
    }
  }

  if (sessions.length === 0) {
    return NextResponse.json({
      ok: true,
      summary: "Ukoncz kilka sesji. Wtedy AI przygotuje krotkie podsumowanie trendu.",
      category_breakdown: [],
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
    let rateLimit: Awaited<ReturnType<typeof enforceAiRateLimit>> | null = null;

    try {
      rateLimit = await enforceAiRateLimit({
        request,
        action: AI_GENERATION_RATE_LIMIT_ACTION,
        userId: access.userId,
        role: access.role,
      });
    } catch (error) {
      if (isRateLimitInfrastructureUnavailable(error)) {
        console.error("[ai-summary] Rate limit unavailable, skipping enforcement", {
          message: error instanceof Error ? error.message : String(error),
        });
      } else {
        throw error;
      }
    }

    if (rateLimit && !rateLimit.allowed) {
      return NextResponse.json(buildRateLimitErrorPayload(rateLimit), {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      });
    }

    const openai = getOpenAIServerClient();
    const sessionsData = buildSessionsJson(sessions);
    const concreteAreas = buildConcreteAreasInsight(tagPerformance);
    const { systemPrompt, userPrompt } = buildPrompts(
      sessions,
      fallbackBreakdownDetailed,
      summaryStats,
      concreteAreas,
    );
    const dataForPrompt = {
      systemPrompt,
      userPrompt,
    };

    console.log("AI SUMMARY INPUT", JSON.stringify({
      sessions: sessionsData,
      categoryBreakdown: fallbackBreakdownDetailed,
      concreteAreas,
      summaryStats,
      promptData: dataForPrompt,
    }, null, 2));

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 15000);

    let response: import('openai').OpenAI.Chat.Completions.ChatCompletion;

    try {
      response = await openai.chat.completions.create(
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 500,
        },
        { signal: timeoutController.signal },
      );
    } finally {
      clearTimeout(timeoutId);
    }

    console.log("[ai-summary] OpenAI response", {
      responseId: response.id ?? null,
      model: response.model ?? null,
      choices: response.choices?.length ?? 0,
      finishReason: response.choices?.[0]?.finish_reason ?? null,
    });

    const rawSummary = extractChatCompletionText(response);
    const { summary } = normalizeSummaryPayload(rawSummary, fallbackBreakdown);
    const categoryBreakdown = fallbackBreakdown;
    const deterministicSummary = buildDeterministicSummary(fallbackBreakdownDetailed);
    const normalizedSummary = summary.trim();
    const shouldOverrideSummary =
      normalizedSummary.length === 0 ||
      ((normalizedSummary.includes("nie uzyskano") || normalizedSummary.includes("nie zarejestrowano")) &&
        fallbackBreakdownDetailed.some((item) => (item.percent ?? 0) > 0));
    const finalSummary = shouldOverrideSummary ? deterministicSummary : normalizedSummary;
    console.log("[ai-summary] Parsed text", { empty: finalSummary.length === 0, overridden: shouldOverrideSummary });

    if (!finalSummary) {
      console.error("[ai-summary] Empty OpenAI response payload", {
        responseShape: {
          id: response.id ?? null,
          model: response.model ?? null,
          object: (response as { object?: string }).object ?? null,
        },
        choices: response.choices?.length ?? 0,
        finishReason: response.choices?.[0]?.finish_reason ?? null,
        firstMessageContentType: typeof response.choices?.[0]?.message?.content,
      });
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
      summary: finalSummary,
      categoryBreakdown,
      sessionsUsed: sessions.length,
      sessionSignature,
      generatedAt,
      refreshLockedUntil,
    });

    return NextResponse.json({
      ok: true,
      summary: finalSummary,
      category_breakdown: categoryBreakdown,
      debug: debugPayload,
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
      logOpenAIBackendError("ai-summary", error);

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

    logOpenAIBackendError("ai-summary", error);

    return NextResponse.json(
      {
        error: "Nie udalo sie wygenerowac podsumowania AI.",
      },
      { status: 500 },
    );
  }
}




