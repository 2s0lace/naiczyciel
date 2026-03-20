import { NextResponse } from "next/server";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import {
  clampQuestionCount,
  fetchQuestionsForExerciseIds,
  fetchQuestionsForMode,
  fetchSessionAnswers,
} from "@/lib/quiz/repository";
import { getSetSlots, getSetsForTier, type E8SetDefinition } from "@/lib/quiz/set-catalog";
import { loadSetCatalogFromDatabase } from "@/lib/quiz/set-catalog-store";
import type { QuizMode } from "@/lib/quiz/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

type SessionLookupRow = {
  id?: string;
  status?: string;
  mode?: string;
  set_id?: string | null;
  requested_count?: number | null;
};

type ExerciseAuditRow = {
  id?: string | null;
  status?: string | null;
  task_type?: string | null;
};

function normalizeSetId(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asFiniteNumber(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeIds(raw: string[], count: number): string[] {
  const seen = new Set<string>();
  const next: string[] = [];

  for (const item of raw) {
    const id = item.trim();

    if (!id || seen.has(id)) {
      continue;
    }

    seen.add(id);
    next.push(id);

    if (next.length >= count) {
      break;
    }
  }

  return next;
}

async function buildSetParseFailureDetails(params: {
  supabase: ReturnType<typeof getSupabaseServerClient>;
  setItem: E8SetDefinition;
  expectedCount: number;
  parsedCount: number;
}): Promise<string> {
  const { supabase, setItem, expectedCount, parsedCount } = params;
  const selectedIds = normalizeIds(setItem.questionIds ?? [], expectedCount);

  if (selectedIds.length === 0) {
    return `Set ${setItem.id} nie ma questionIds lub sa puste.`;
  }

  const result = await supabase
    .from("quiz_exercises")
    .select("id, status, task_type")
    .in("id", selectedIds);

  if (result.error || !result.data) {
    return `Set ${setItem.id}: nie udalo sie zweryfikowac questionIds (${parsedCount}/${expectedCount}).`;
  }

  const rows = result.data as ExerciseAuditRow[];
  const foundIds = new Set(
    rows
      .map((row) => (typeof row.id === "string" ? row.id.trim() : ""))
      .filter((id) => id.length > 0),
  );

  const missingIds = selectedIds.filter((id) => !foundIds.has(id));
  const inactiveIds = rows
    .filter((row) => typeof row.id === "string" && row.status !== "active")
    .map((row) => String(row.id));
  const unsupportedIds = rows
    .filter(
      (row) =>
        typeof row.id === "string" &&
        row.status === "active" &&
        row.task_type !== "single_choice_short" &&
        row.task_type !== "reading_mc",
    )
    .map((row) => `${String(row.id)}(${String(row.task_type)})`);

  const details: string[] = [
    `Set ${setItem.id}: sparsowano ${parsedCount}/${expectedCount}.`,
    `questionIds w secie: ${selectedIds.length}.`,
    `znalezione w quiz_exercises: ${foundIds.size}.`,
  ];

  if (missingIds.length > 0) {
    details.push(`brakujace ID: ${missingIds.slice(0, 8).join(", ")}${missingIds.length > 8 ? "..." : ""}`);
  }

  if (inactiveIds.length > 0) {
    details.push(`nieaktywne ID: ${inactiveIds.slice(0, 8).join(", ")}${inactiveIds.length > 8 ? "..." : ""}`);
  }

  if (unsupportedIds.length > 0) {
    details.push(`niewspierane task_type: ${unsupportedIds.slice(0, 8).join(", ")}${unsupportedIds.length > 8 ? "..." : ""}`);
  }

  return details.join(" ");
}

async function loadSessionRow(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  sessionId: string,
): Promise<{ row: SessionLookupRow | null; error: string | null }> {
  const selectVariants = [
    "id, status, set_id, mode, requested_count",
    "id, status, set_id, mode",
    "id, status, set_id",
    "id, status, mode, requested_count",
    "id, status, mode",
    "id, status",
  ] as const;

  let lastError: string | null = null;

  for (const select of selectVariants) {
    const result = await supabase
      .from("quiz_sessions")
      .select(select)
      .eq("id", sessionId)
      .maybeSingle();

    if (!result.error) {
      return { row: (result.data as SessionLookupRow | null) ?? null, error: null };
    }

    lastError = result.error.message;
  }

  return { row: null, error: lastError ?? "Nie udalo sie pobrac sesji." };
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json({ error: "Brak sessionId." }, { status: 400 });
    }

    const url = new URL(request.url);
    const requestedMode = url.searchParams.get("mode") ?? "reactions";
    const requestedCountParam = url.searchParams.get("count");
    const requestedCount = requestedCountParam !== null ? Number(requestedCountParam) : Number.NaN;
    const requestedSetId = normalizeSetId(url.searchParams.get("set"));

    const access = await resolveAccessTierFromRequest(request);
    await loadSetCatalogFromDatabase();

    let supabase: ReturnType<typeof getSupabaseServerClient>;

    try {
      supabase = getSupabaseServerClient();
    } catch {
      return NextResponse.json(
        {
          error: "Brak polaczenia z baza danych.",
          details: "Tryb lokalny/mock jest wylaczony.",
        },
        { status: 500 },
      );
    }

    const sessionLookup = await loadSessionRow(supabase, sessionId);

    if (sessionLookup.error) {
      return NextResponse.json(
        {
          error: "Nie udalo sie pobrac sesji.",
          details: sessionLookup.error,
        },
        { status: 500 },
      );
    }

    if (!sessionLookup.row?.id) {
      return NextResponse.json({ error: "Sesja nie istnieje." }, { status: 404 });
    }

    const sessionSetId = normalizeSetId(
      typeof sessionLookup.row.set_id === "string" ? sessionLookup.row.set_id : null,
    );

    const effectiveSetId = requestedSetId ?? sessionSetId;
    const tierSets = getSetsForTier(access.tier);
    const tierSetMap = new Map(tierSets.map((setItem) => [setItem.id, setItem]));
    const allSetMap = access.role === "admin" ? new Map(getSetSlots().map((setItem) => [setItem.id, setItem])) : null;
    const explicitSelectedSet = effectiveSetId
      ? tierSetMap.get(effectiveSetId) ?? allSetMap?.get(effectiveSetId) ?? null
      : null;

    if (effectiveSetId && !explicitSelectedSet) {
      return NextResponse.json(
        {
          error: "Wybrany zestaw nie jest dostepny.",
          details: "Set nie jest przypisany do Twojego dostepu lub nie istnieje.",
        },
        { status: 400 },
      );
    }

    const sessionMode = typeof sessionLookup.row.mode === "string" ? sessionLookup.row.mode : null;
    const modeHint = (explicitSelectedSet?.mode ?? sessionMode ?? requestedMode) as QuizMode;

    const autoAssignedSet =
      !explicitSelectedSet && tierSets.length > 0
        ? tierSets.find((setItem) => setItem.mode.trim().toLowerCase() === modeHint.trim().toLowerCase()) ?? tierSets[0] ?? null
        : null;

    const selectedSet = explicitSelectedSet ?? autoAssignedSet;
    const mode = (selectedSet?.mode ?? modeHint) as QuizMode;
    const sessionRequestedCount = asFiniteNumber(sessionLookup.row.requested_count);
    const requestedCountResolved = clampQuestionCount(
      selectedSet?.questionCount ?? (Number.isFinite(requestedCount) ? requestedCount : sessionRequestedCount ?? 10),
    );
    const questionPoolSize =
      Array.isArray(selectedSet?.questionIds) && selectedSet.questionIds.length > 0
        ? selectedSet.questionIds.length
        : null;
    const effectiveCount =
      questionPoolSize && questionPoolSize > 0
        ? Math.min(requestedCountResolved, questionPoolSize)
        : requestedCountResolved;
    const includeDraftQuestions = access.role === "admin";

    const hasExplicitSetIds = Boolean(selectedSet?.questionIds && selectedSet.questionIds.length > 0);

    const [primaryQuestions, answers] = await Promise.all([
      hasExplicitSetIds
        ? fetchQuestionsForExerciseIds({
            supabase,
            exerciseIds: selectedSet?.questionIds ?? [],
            count: effectiveCount,
            includeDraft: includeDraftQuestions,
          })
        : fetchQuestionsForMode({
            supabase,
            mode,
            count: effectiveCount,
            includeDraft: includeDraftQuestions,
          }),
      fetchSessionAnswers({
        supabase,
        sessionId,
      }),
    ]);

    let questions = primaryQuestions;

    if (hasExplicitSetIds && questions.length < effectiveCount) {
      const fallbackByMode = await fetchQuestionsForMode({
        supabase,
        mode,
        count: effectiveCount,
        includeDraft: includeDraftQuestions,
      });

      if (fallbackByMode.length >= 5) {
        questions = fallbackByMode;
      }
    }

    const minimumPlayableCount = hasExplicitSetIds ? effectiveCount : Math.min(5, effectiveCount);

    if (questions.length < minimumPlayableCount) {
      const details = selectedSet
        ? await buildSetParseFailureDetails({
            supabase,
            setItem: selectedSet,
            expectedCount: effectiveCount,
            parsedCount: questions.length,
          })
        : `Za malo poprawnych pytan w bazie dla trybu ${mode} (${questions.length}/${effectiveCount}).`;

      return NextResponse.json(
        {
          error: "Nie udalo sie sparsowac przyporzadkowanego testu z bazy danych.",
          details,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      sessionId,
      mode,
      setId: selectedSet?.id,
      status: typeof sessionLookup.row.status === "string" ? sessionLookup.row.status : "in_progress",
      questions,
      answers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Wystapil blad podczas pobierania quizu.",
        details: message,
      },
      { status: 500 },
    );
  }
}
