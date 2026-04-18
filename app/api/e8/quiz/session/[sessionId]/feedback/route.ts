import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  AI_GENERATION_RATE_LIMIT_ACTION,
  buildRateLimitErrorPayload,
  enforceAiRateLimit,
} from "@/lib/ai/rate-limit";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import { buildSummary, fetchSessionAnswers } from "@/lib/quiz/repository";
import {
  buildCanonicalCategoryBreakdown,
  fetchSessionCategoryStatsMap,
} from "@/lib/quiz/session-category-stats";
import type { CategoryBreakdownItem, QuizAnswerSnapshot, QuizQuestion } from "@/lib/quiz/types";
import { getAccessibleLocalSession, getLocalSessionPayload, isLocalSessionId } from "@/lib/quiz/local-store";
import { requireOwnedSession } from "@/lib/quiz/require-owned-session";
import { loadSetCatalogFromDatabase } from "@/lib/quiz/set-catalog-store";
import { loadQuestionsForOwnedSession } from "@/lib/quiz/session-questions";
import { resolveQuestionCategoryLabel } from "@/lib/quiz/session-category-stats";
import { getOpenAIServerClient } from "@/lib/openai/server";
import { getSupabaseUserClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

type SubtopicBreakdownItem = {
  area: string;
  topic: string;
  attempts: number;
  correct: number;
  percent: number;
};

type SanitizedPayload = {
  mode: string;
  correctAnswers: number;
  totalQuestions: number;
  scorePercent: number;
  categoryBreakdown: CategoryBreakdownItem[];
  subtopicBreakdown: SubtopicBreakdownItem[];
};

function buildSubtopicBreakdown(params: {
  questions: QuizQuestion[];
  answers: QuizAnswerSnapshot[];
}): SubtopicBreakdownItem[] {
  const answerMap = new Map(params.answers.map((a) => [a.questionId, a]));
  const aggregates = new Map<string, { area: string; topic: string; attempts: number; correct: number }>();

  for (const question of params.questions) {
    const area = resolveQuestionCategoryLabel(question) ?? "Reactions";
    const topic = typeof question.category === "string" && question.category.trim().length > 0
      ? question.category.trim()
      : area;

    if (!topic) {
      continue;
    }

    const key = `${area}::${topic}`;
    const current = aggregates.get(key) ?? { area, topic, attempts: 0, correct: 0 };

    const questionIds =
      question.type === "single_question" ? [question.id] : question.questions.map((item) => item.id);

    current.attempts += questionIds.length;

    for (const id of questionIds) {
      const answer = answerMap.get(id);

      if (answer?.isCorrect) {
        current.correct += 1;
      }
    }

    aggregates.set(key, current);
  }

  return Array.from(aggregates.values())
    .filter((item) => item.attempts > 0)
    .map((item) => ({
      area: item.area,
      topic: item.topic,
      attempts: item.attempts,
      correct: item.correct,
      percent: Math.round((item.correct / item.attempts) * 100),
    }))
    .sort((a, b) => a.percent - b.percent);
}

function isRateLimitInfrastructureUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("public.rate_limits") && message.includes("schema cache")
  ) || message.includes("Missing SUPABASE_SERVICE_ROLE_KEY for admin client");
}

function buildPrompt(payload: SanitizedPayload) {
  const dataBlock = JSON.stringify(
    {
      mode: payload.mode,
      score: `${payload.correctAnswers}/${payload.totalQuestions} (${payload.scorePercent}%)`,
      categories: payload.categoryBreakdown,
      subtopics: payload.subtopicBreakdown,
    },
    null,
    2,
  );

  return [
    "Jestes nauczycielem jezyka angielskiego. Uczen wlasnie skonczyl sesje quizowa - napisz mu krotki komentarz.",
    "",
    "Wyniki sesji:",
    "```json",
    dataBlock,
    "```",
    "",
    "Jak pisac:",
    "- Pisz na podstawie danych z JSON. Nie wymyslaj.",
    "- Jezeli jakis subtopic z Grammar ma niski percent, napisz konkretnie jak sie nazywa (np. 'Future Simple',",
    "  'Modal should') - nie pisz ogolnie 'gramatyka'.",
    "- Tak samo dla Vocabulary, Reactions, Reading MC - jesli cos konkretnego kuleje, nazwij to.",
    "- Jesli cos poszlo dobrze (percent >= 70), wspomnij to naturalnie.",
    "- Na koniec powiedz co warto zrobic przed nastepna sesja - 1 konkretna rzecz.",
    "- Pisz tak jak mowisz, nie jak robot. Krotkie zdania, bez patosu.",
    "- Nie uzywaj zwrotow: 'wyniki wskazuja', 'na podstawie danych', 'sugeruje trudnosci', 'niestety'.",
    "",
    "Format: jeden akapit, 3-5 zdan. Bez naglowkow, bez listy, bez pogrubien.",
  ].join("\n");
}

function extractResponseText(response: { output_text?: string }) {
  return typeof response.output_text === "string" ? response.output_text.trim() : "";
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json({ error: "Brak sessionId." }, { status: 400 });
    }

    const access = await resolveAccessTierFromRequest(request);

    if (isLocalSessionId(sessionId)) {
      const localSession = getAccessibleLocalSession(sessionId, access.userId);
      const localPayload = localSession ? getLocalSessionPayload(sessionId) : null;

      if (!localPayload) {
        return NextResponse.json(
          {
            error: "Lokalna sesja nie istnieje.",
          },
          { status: 404 },
        );
      }

      const summary = buildSummary({
        questions: localPayload.questions,
        answers: localPayload.answers,
      });
      const payload: SanitizedPayload = {
        mode: typeof localPayload.mode === "string" ? localPayload.mode : "reactions",
        correctAnswers: summary.correctAnswers,
        totalQuestions: summary.totalQuestions,
        scorePercent: summary.scorePercent,
        categoryBreakdown: buildCanonicalCategoryBreakdown({
          questions: localPayload.questions,
          answers: localPayload.answers,
        }),
        subtopicBreakdown: buildSubtopicBreakdown({
          questions: localPayload.questions,
          answers: localPayload.answers,
        }),
      };

      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          {
            error: "Brak konfiguracji OpenAI API.",
          },
          { status: 503 },
        );
      }

      const prompt = buildPrompt(payload);
      const openai = getOpenAIServerClient();
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 15000);

      let response: { output_text?: string };

      try {
        response = await openai.responses.create(
          {
            model: "gpt-4o-mini",
            input: prompt,
            temperature: 0.2,
            max_output_tokens: 300,
          },
          {
            signal: timeoutController.signal,
          },
        );
      } finally {
        clearTimeout(timeoutId);
      }

      const feedback = extractResponseText(response);

      if (!feedback) {
        return NextResponse.json(
          {
            error: "Brak odpowiedzi od AI.",
          },
          { status: 502 },
        );
      }

      return NextResponse.json({
        ok: true,
        feedback,
        generatedAt: new Date().toISOString(),
      });
    }

    if (!access.userId || !access.accessToken) {
      return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
    }

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
        console.error("[quiz-feedback] Rate limit unavailable, skipping enforcement", {
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "Brak konfiguracji OpenAI API.",
        },
        { status: 503 },
      );
    }

    await loadSetCatalogFromDatabase({
      accessToken: access.accessToken,
      allowBootstrap: false,
    });

    const supabase = getSupabaseUserClient(access.accessToken);

    let sessionRow;

    try {
      sessionRow = await requireOwnedSession(supabase, sessionId, access.userId);
    } catch {
      return NextResponse.json(
        {
          error: "Sesja nie istnieje albo nie nalezy do uzytkownika.",
        },
        { status: 404 },
      );
    }

    const [questions, answers] = await Promise.all([
      loadQuestionsForOwnedSession({
        supabase,
        session: sessionRow,
        tier: access.tier,
        role: access.role,
      }),
      fetchSessionAnswers({
        supabase,
        sessionId,
      }),
    ]);

    const summary = buildSummary({ questions, answers });
    const storedCategoryBreakdown = await fetchSessionCategoryStatsMap({
      supabase,
      sessionIds: [sessionId],
    });
    const categoryBreakdown =
      storedCategoryBreakdown.get(sessionId) ??
      buildCanonicalCategoryBreakdown({
        questions,
        answers,
      });

    const payload: SanitizedPayload = {
      mode: typeof sessionRow.mode === "string" ? sessionRow.mode : "reactions",
      correctAnswers: summary.correctAnswers,
      totalQuestions: summary.totalQuestions,
      scorePercent: summary.scorePercent,
      categoryBreakdown,
      subtopicBreakdown: buildSubtopicBreakdown({ questions, answers }),
    };

    const prompt = buildPrompt(payload);
    const openai = getOpenAIServerClient();
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 15000);

    let response: { output_text?: string };

    try {
      response = await openai.responses.create(
        {
          model: "gpt-4o-mini",
          input: prompt,
          temperature: 0.2,
          max_output_tokens: 300,
        },
        {
          signal: timeoutController.signal,
        },
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const feedback = extractResponseText(response);

    if (!feedback) {
      return NextResponse.json(
        {
          error: "Brak odpowiedzi od AI.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      feedback,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const isAbort = error instanceof DOMException && error.name === "AbortError";

    if (isAbort) {
      return NextResponse.json(
        {
          error: "Przekroczono czas oczekiwania.",
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

    console.error("[quiz-feedback] unexpected error", error);

    return NextResponse.json(
      {
        error: "Nie udalo sie wygenerowac feedbacku AI.",
      },
      { status: 500 },
    );
  }
}
