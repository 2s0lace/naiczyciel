import OpenAI from "openai";
import { NextResponse } from "next/server";
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

const ALLOWED_MODES = new Set(["reactions", "grammar", "vocabulary"]);

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
  return [
    "Tworzysz krotkie podsumowanie po mini-quizie dla ucznia na mobile.",
    "Pisz po polsku, prosto i konkretnie.",
    "",
    `Tryb: ${payload.mode}`,
    `Wynik: ${payload.correctAnswers}/${payload.totalQuestions} (${payload.scorePercent}%)`,
    `Najmocniejszy obszar: ${payload.strongestArea}`,
    `Najslabszy obszar: ${payload.weakestArea}`,
    "",
    "Wymagany format (dokladnie 4 linie):",
    "Diagnoza: ...",
    "Mocna strona: ...",
    "Do poprawy: ...",
    "Na teraz: ...",
    "",
    "Zasady:",
    "- max 1 krotkie zdanie w kazdej linii",
    "- bez markdown, bez numeracji, bez list",
    "- bez ogolnikow i bez motywacyjnych frazesow",
    "- kazda linia ma byc konkretna i praktyczna",
    "- lacznie max 50 slow",
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
      return NextResponse.json(
        { error: "Brak konfiguracji OpenAI API.", details: "Skontaktuj sie z administratorem." },
        { status: 503 },
      );
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