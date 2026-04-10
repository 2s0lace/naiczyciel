import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  AI_GENERATION_RATE_LIMIT_ACTION,
  buildRateLimitErrorPayload,
  enforceAiRateLimit,
} from "@/lib/ai/rate-limit";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import { getOpenAIServerClient } from "@/lib/openai/server";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

type FeedbackBody = {
  mode?: unknown;
  correctAnswers?: unknown;
  totalQuestions?: unknown;
  scorePercent?: unknown;
  strongestArea?: unknown;
  weakestArea?: unknown;
};

type SanitizedPayload = {
  mode: string;
  correctAnswers: number;
  totalQuestions: number;
  scorePercent: number;
  strongestArea: string;
  weakestArea: string;
};

const ALLOWED_MODES = new Set([
  "reactions",
  "grammar",
  "vocabulary",
  "reading_mc",
  "gap_fill_text",
]);

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

function parseInteger(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(n)) {
    return null;
  }

  return n;
}

function sanitizeMode(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = normalizeToken(value);

  if (!ALLOWED_MODES.has(normalized)) {
    return null;
  }

  return normalized;
}

function validatePayload(body: FeedbackBody): { ok: true; payload: SanitizedPayload } | { ok: false; message: string } {
  const mode = sanitizeMode(body.mode);

  if (!mode) {
    return { ok: false, message: "Nieprawidlowy tryb quizu." };
  }

  const totalQuestions = parseInteger(body.totalQuestions);
  const correctAnswers = parseInteger(body.correctAnswers);
  const scorePercentInput = parseInteger(body.scorePercent);

  if (totalQuestions === null || totalQuestions < 1 || totalQuestions > 100) {
    return { ok: false, message: "Nieprawidlowa liczba pytan." };
  }

  if (correctAnswers === null || correctAnswers < 0 || correctAnswers > totalQuestions) {
    return { ok: false, message: "Nieprawidlowa liczba poprawnych odpowiedzi." };
  }

  if (scorePercentInput === null || scorePercentInput < 0 || scorePercentInput > 100) {
    return { ok: false, message: "Nieprawidlowy wynik procentowy." };
  }

  const computedPercent = Math.round((correctAnswers / totalQuestions) * 100);

  return {
    ok: true,
    payload: {
      mode,
      correctAnswers,
      totalQuestions,
      scorePercent: computedPercent,
      strongestArea: sanitizeArea(body.strongestArea),
      weakestArea: sanitizeArea(body.weakestArea),
    },
  };
}

function buildPrompt(payload: SanitizedPayload) {
  const sessionDetails = [
    `Tryb: ${payload.mode}`,
    `Wynik: ${payload.correctAnswers}/${payload.totalQuestions} (${payload.scorePercent}%)`,
    `Mocna strona (metryka): ${payload.strongestArea}`,
    `Do poprawy (metryka): ${payload.weakestArea}`,
  ].join(" | ");

  return [
    "Twórz krótką informację zwrotną dla ucznia po rozwiązaniu zestawu z angielskiego.",
    "",
    "Cel:",
    "Feedback ma być pomocny, prosty, konkretny i wspierający. Ma brzmieć jak dobra wskazówka od nauczyciela, a nie jak automatyczny raport albo coachingowy slogan.",
    "",
    "Dane o tej sesji:",
    sessionDetails,
    "",
    "Zasady:",
    "- pisz po polsku",
    "- ton: spokojny, życzliwy, konkretny",
    "- nie zawstydzaj ucznia",
    "- nie używaj słów typu: „niestety”, „tylko”, „słabo”, „porażka”",
    "- nie oceniaj ucznia jako osoby",
    "- oceniaj wyłącznie wynik i obszar do poprawy",
    "- nie używaj pustych sformułowań typu „działające schematy”, „musisz się bardziej postarać”, „więcej zyskasz”",
    "- nie pisz ogólników, jeśli nie ma konkretu",
    "- pokaż 1 mocną stronę, nawet małą",
    "- wskaż 1 główny problem",
    "- zaproponuj 1 prosty następny krok",
    "- maksymalnie 4 krótkie sekcje",
    "- każda sekcja ma mieć 1–2 zdania",
    "- język ma być zrozumiały dla ucznia szkoły podstawowej",
    "",
    "Struktura:",
    "1. Ocena ogólna",
    "2. Co już działa",
    "3. Nad czym popracować",
    "4. Co zrobić teraz",
    "",
    "Dodatkowe wytyczne:",
    "- jeśli wynik jest niski, zachowaj wspierający ton i pokaż, że da się poprawić jeden konkretny obszar",
    "- jeśli wynik jest średni, pokaż, co już działa i co da największy progres",
    "- jeśli wynik jest wysoki, pochwal konkretnie i wskaż mały kolejny krok",
    "- jeśli z danych wynika konkretny typ błędu, nazwij go prostym językiem",
    "- jeśli brak szczegółowych danych o błędach, nie zmyślaj — napisz ostrożnie i ogólnie, ale nadal konkretnie",
    "",
    "Styl:",
    "- krótkie zdania",
    "- naturalny język",
    "- zero mentorsko-korporacyjnego tonu",
    "- feedback ma pomagać uczniowi zrozumieć: „co było nie tak?” i „co zrobić dalej?”",
    "",
    "Jeśli to możliwe, odwołaj się do konkretnego typu błędu, np.:",
    "- pomylenie czasu",
    "- niezrozumienie sensu pytania",
    "- wybranie odpowiedzi po jednym słowie z tekstu",
    "- pominięcie słowa przeczącego",
    "- zbyt szybkie zgadywanie bez sprawdzenia kontekstu",
    "",
    "Na końcu wygeneruj tylko gotowy feedback dla ucznia, bez komentarzy technicznych i bez wyjaśniania zasad.",
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

    const body = (await request.json().catch(() => ({}))) as FeedbackBody;
    const validated = validatePayload(body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.message }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: "Brak konfiguracji OpenAI API.",
        details: "Skontaktuj sie z administratorem.",
      }, { status: 503 });
    }

    let access: Awaited<ReturnType<typeof resolveAccessTierFromRequest>> = {
      tier: "unregistered",
      userId: null,
      role: null,
    };

    try {
      access = await resolveAccessTierFromRequest(request);
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
    } catch (rateLimitError) {
      console.error("[quiz-feedback] rate limit check failed, continuing without limiter", rateLimitError);
    }

    const prompt = buildPrompt(validated.payload);
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
          details: "Sprobuj ponownie za chwile.",
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
          details: "Sprobuj ponownie za chwile.",
        },
        { status: 504 },
      );
    }

    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          {
            error: "Przekroczono limit zapytan AI.",
            details: "Sprobuj ponownie za chwile.",
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          error: "Usluga AI jest chwilowo niedostepna.",
          details: "Sprobuj ponownie za chwile.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        error: "Nie udalo sie wygenerowac feedbacku AI.",
        details: "Sprobuj ponownie za chwile.",
      },
      { status: 500 },
    );
  }
}



