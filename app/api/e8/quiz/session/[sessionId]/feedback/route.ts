import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  AI_GENERATION_RATE_LIMIT_ACTION,
  buildRateLimitErrorPayload,
  enforceAiRateLimit,
} from "@/lib/ai/rate-limit";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import { buildSummary, fetchSessionAnswers } from "@/lib/quiz/repository";
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
  strongestArea: string;
  weakestArea: string;
};

const AREA_CANONICAL: Record<string, string> = {
  "codzienne reakcje": "Codzienne reakcje",
  wsparcie: "Wsparcie",
  prosby: "Prosby",
  "dobre wiadomosci": "Dobre wiadomosci",
  planowanie: "Planowanie",
  pomoc: "Pomoc",
  spotkania: "Spotkania",
  opinia: "Opinia",
  przeprosiny: "Przeprosiny",
  brak: "brak",
};

function normalizeToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
}

function sanitizeArea(value: unknown): string {
  if (typeof value !== "string") {
    return "brak";
  }

  const normalized = normalizeToken(value);
  return AREA_CANONICAL[normalized] ?? "brak";
}

function buildPrompt(payload: SanitizedPayload) {
  const sessionDetails = [
    `Tryb: ${payload.mode}`,
    `Wynik: ${payload.correctAnswers}/${payload.totalQuestions} (${payload.scorePercent}%)`,
    `Mocna strona (metryka): ${payload.strongestArea}`,
    `Do poprawy (metryka): ${payload.weakestArea}`,
  ].join(" | ");

  return [
    "Tworz krotka informacje zwrotna dla ucznia po rozwiazaniu zestawu z angielskiego.",
    "",
    "Cel:",
    "Feedback ma byc pomocny, prosty, konkretny i wspierajacy. Ma brzmiec jak dobra wskazowka od nauczyciela, a nie jak automatyczny raport albo coachingowy slogan.",
    "",
    "Dane o tej sesji:",
    sessionDetails,
    "",
    "Zasady:",
    "- pisz po polsku",
    "- ton: spokojny, zyczliwy, konkretny",
    "- nie zawstydzaj ucznia",
    "- nie uzywaj slow typu: „niestety”, „tylko”, „slabo”, „porazka”",
    "- nie oceniaj ucznia jako osoby",
    "- oceniaj wylacznie wynik i obszar do poprawy",
    "- nie uzywaj pustych sformulowan typu „dzialajace schematy”, „musisz sie bardziej postarac”, „wiecej zyskasz”",
    "- nie pisz ogolnikow, jesli nie ma konkretu",
    "- pokaz 1 mocna strone, nawet mala",
    "- wskaz 1 glowny problem",
    "- zaproponuj 1 prosty nastepny krok",
    "- maksymalnie 4 krotkie sekcje",
    "- kazda sekcja ma miec 1-2 zdania",
    "- jezyk ma byc zrozumialy dla ucznia szkoly podstawowej",
    "",
    "Struktura:",
    "1. Ocena ogolna",
    "2. Co juz dziala",
    "3. Nad czym popracowac",
    "4. Co zrobic teraz",
    "",
    "Dodatkowe wytyczne:",
    "- jesli wynik jest niski, zachowaj wspierajacy ton i pokaz, ze da sie poprawic jeden konkretny obszar",
    "- jesli wynik jest sredni, pokaz, co juz dziala i co da najwiekszy progres",
    "- jesli wynik jest wysoki, pochwal konkretnie i wskaz maly kolejny krok",
    "- jesli z danych wynika konkretny typ bledu, nazwij go prostym jezykiem",
    "- jesli brak szczegolowych danych o bledach, nie zmyslaj — napisz ostroznie i ogolnie, ale nadal konkretnie",
    "",
    "Styl:",
    "- krotkie zdania",
    "- naturalny jezyk",
    "- zero mentorsko-korporacyjnego tonu",
    "- feedback ma pomagac uczniowi zrozumiec: „co bylo nie tak?” i „co zrobic dalej?”",
    "",
    "Jesli to mozliwe, odwola sie do konkretnego typu bledu, np.:",
    "- pomylenie czasu",
    "- niezrozumienie sensu pytania",
    "- wybranie odpowiedzi po jednym slowie z tekstu",
    "- pominiecie slowa przeczacego",
    "- zbyt szybkie zgadywanie bez sprawdzenia kontekstu",
    "",
    "Na koncu wygeneruj tylko gotowy feedback dla ucznia, bez komentarzy technicznych i bez wyjasniania zasad.",
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
    const payload: SanitizedPayload = {
      mode: typeof sessionRow.mode === "string" ? sessionRow.mode : "reactions",
      correctAnswers: summary.correctAnswers,
      totalQuestions: summary.totalQuestions,
      scorePercent: summary.scorePercent,
      strongestArea: sanitizeArea(summary.strongestArea),
      weakestArea: sanitizeArea(summary.weakestArea),
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
          max_output_tokens: 180,
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
