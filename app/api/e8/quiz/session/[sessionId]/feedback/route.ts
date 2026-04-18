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
import type { CategoryBreakdownItem } from "@/lib/quiz/types";
import { requireOwnedSession } from "@/lib/quiz/require-owned-session";
import { loadSetCatalogFromDatabase } from "@/lib/quiz/set-catalog-store";
import { loadQuestionsForOwnedSession } from "@/lib/quiz/session-questions";
import { getOpenAIServerClient } from "@/lib/openai/server";
import { getSupabaseUserClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

type SanitizedPayload = {
  mode: string;
  correctAnswers: number;
  totalQuestions: number;
  scorePercent: number;
  categoryBreakdown: CategoryBreakdownItem[];
};

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
    },
    null,
    2,
  );

  return [
    "Jestes nauczycielem jezyka angielskiego. Napisz krotki feedback po sesji quizowej.",
    "",
    "Dane sesji (JSON):",
    "```json",
    dataBlock,
    "```",
    "",
    "Zasady - przeczytaj uwaznie:",
    "- Pisz wylacznie na podstawie powyzszego JSON. Nie zgaduj. Nie wymyslaj.",
    "- Kategorie z has_data:true pojawily sie w tej sesji - mozesz je opisac.",
    "- Kategorie z percent:0 i has_data:true pojawily sie, ale wynik byl zerowy - opisz to wprost.",
    "- Jezeli zadna kategoria nie ma percent>=50, sekcje 'Mocna strona' pomin lub napisz ogolnie o probie.",
    "- Nie wymyslaj kategorii, ktore nie sa w JSON.",
    "- Ton: konkretny, spokojny, jak nauczyciel - nie robot, nie coach.",
    "- Krotkie zdania. Jezyk prosty.",
    "- ZAKAZ uzywania zwrotow: 'wyniki nie zostaly zarejestrowane', 'sugeruje trudnosci',",
    "  'pokazuje pewna zdolnosc', 'w tej kategorii', 'na podstawie danych', 'niestety', 'porazka'.",
    "",
    "Format odpowiedzi - uzyj DOKLADNIE tych naglowkow, w tej kolejnosci:",
    "",
    "Ocena ogolna:",
    "[1 zdanie o ogolnym wyniku]",
    "",
    "Mocna strona:",
    "[1 zdanie - TYLKO jesli jakakolwiek kategoria ma percent>=50, inaczej napisz 'Pierwsza sesja to dobry start.']",
    "",
    "Do poprawy:",
    "[1 zdanie o kategorii z najnizszym percent wsrod has_data:true]",
    "",
    "Na teraz:",
    "[1 konkretna akcja do wykonania w nastepnej sesji]",
    "",
    "Napisz sam feedback. Bez komentarzy, bez wyjasniania zasad.",
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
