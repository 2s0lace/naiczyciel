import { NextResponse } from "next/server";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import {
  fetchAdaptiveQuestions,
  clampQuestionCount,
  fetchQuestionsForExerciseIds,
  fetchQuestionsForMode,
  fetchSessionAnswers,
} from "@/lib/quiz/repository";
import { getSetSlots, getSetsForTier, type E8SetDefinition } from "@/lib/quiz/set-catalog";
import { loadSetCatalogFromDatabase } from "@/lib/quiz/set-catalog-store";
import type { QuizMode } from "@/lib/quiz/types";
import { getAccessibleLocalSession, getLocalSessionPayload, isLocalSessionId } from "@/lib/quiz/local-store";
import { getSupabaseUserClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
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

function normalizeMode(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeModeList(raw: string[]): string[] {
  return raw
    .map((value) => normalizeMode(value))
    .filter((value, index, list) => value.length > 0 && list.indexOf(value) === index);
}

function parseModesFromValue(value: string | null | undefined): string[] {
  const normalized = normalizeMode(value);

  if (!normalized || normalized === "auto" || normalized === "mixed") {
    return [];
  }

  if (normalized.startsWith("mixed:")) {
    return normalizeModeList(normalized.slice("mixed:".length).split(","));
  }

  return [normalized];
}

function serializeModeValue(modes: string[]): string {
  const normalized = normalizeModeList(modes);

  if (normalized.length <= 1) {
    return normalized[0] ?? "auto";
  }

  return `mixed:${normalized.join(",")}`;
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
  supabase: ReturnType<typeof getSupabaseUserClient>;
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
        row.task_type !== "reading_mc" &&
        row.task_type !== "gap_fill_text",
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

export async function GET(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json({ error: "Brak sessionId." }, { status: 400 });
    }

    const access = await resolveAccessTierFromRequest(request);
    const localSession = isLocalSessionId(sessionId) ? getAccessibleLocalSession(sessionId, access.userId) : null;

    if (isLocalSessionId(sessionId)) {
      const localPayload = localSession ? getLocalSessionPayload(sessionId) : null;

      if (!localPayload) {
        console.log("GET", { sessionId, sessionFound: false, localSessionFound: !!localSession });
        return NextResponse.json(
          {
            error: "Nie udalo sie rozpoczac quizu. Brak lokalnej sesji.",
          },
          { status: 404 },
        );
      }

      return NextResponse.json(localPayload);
    }

    if (!access.userId || !access.accessToken) {
      return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
    }

    await loadSetCatalogFromDatabase({
      accessToken: access.accessToken,
      allowBootstrap: false,
    });

    const url = new URL(request.url);
    const requestedMode = url.searchParams.get("mode") ?? "reactions";
    const requestedCountParam = url.searchParams.get("count");
    const requestedCount = requestedCountParam !== null ? Number(requestedCountParam) : Number.NaN;
    const requestedSetId = normalizeSetId(url.searchParams.get("set"));
    const requestedModes = normalizeModeList((url.searchParams.get("modes") ?? "").split(","));
    const requestedFocusLabel = url.searchParams.get("focus")?.trim() || null;
    const requestedFocusSource = url.searchParams.get("focusSource")?.trim().toLowerCase() || null;
    const requestedFocusRaw = url.searchParams.get("focusRaw")?.trim() || null;
    const supabase = getSupabaseUserClient(access.accessToken);
    const sessionResult = await supabase
      .from("quiz_sessions")
      .select("id, user_id, status, mode, requested_count")
      .eq("id", sessionId)
      .eq("user_id", access.userId)
      .maybeSingle();
    const session = !sessionResult.error && sessionResult.data ? sessionResult.data : null;

    if (!session) {
      console.log("GET", { sessionId, sessionFound: !!session, localSessionFound: !!localSession });
      return NextResponse.json({ error: "Sesja nie istnieje." }, { status: 404 });
    }

    const effectiveSetId = requestedSetId ?? null;
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
        },
        { status: 400 },
      );
    }

    const sessionMode = typeof session.mode === "string" ? session.mode : null;
    const modeHint = (explicitSelectedSet?.mode ?? sessionMode ?? requestedMode) as QuizMode;
    const tierModes = normalizeModeList(tierSets.map((setItem) => setItem.mode));
    const sessionDerivedModes = parseModesFromValue(sessionMode).filter((mode) => tierModes.includes(mode));
    const effectiveModes = explicitSelectedSet
      ? [normalizeMode(explicitSelectedSet.mode)]
      : requestedModes.length > 0
        ? requestedModes.filter((mode) => tierModes.includes(mode))
        : sessionDerivedModes.length > 0
          ? sessionDerivedModes
          : normalizeMode(requestedMode) !== "auto"
            ? [normalizeMode(requestedMode)]
            : tierModes;

    const selectedSet = explicitSelectedSet ?? null;
    const mode = (selectedSet?.mode ?? serializeModeValue(effectiveModes) ?? modeHint) as QuizMode;
    const sessionRequestedCount = asFiniteNumber(session.requested_count);
    const requestedCountResolved = clampQuestionCount(
      Number.isFinite(requestedCount) ? requestedCount : sessionRequestedCount ?? 10,
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
            shuffleSeed: (selectedSet?.questionIds?.length ?? 0) > effectiveCount ? sessionId : undefined,
          })
        : fetchAdaptiveQuestions({
            supabase,
            userId: access.userId,
            modes: effectiveModes.length > 0 ? effectiveModes : [normalizeMode(modeHint)],
            count: effectiveCount,
            includeDraft: includeDraftQuestions,
            excludeSessionId: sessionId,
            shuffleSeed: sessionId,
            focusLabel: requestedFocusLabel,
            focusSource: requestedFocusSource,
            focusRaw: requestedFocusRaw,
          }),
      fetchSessionAnswers({
        supabase,
        sessionId,
      }),
    ]);

    const answeredExerciseIds = normalizeIds(
      answers.map((answer) => {
        const [exerciseId] = answer.questionId.split("::");
        return exerciseId ?? answer.questionId;
      }),
      effectiveCount,
    );

    const answeredQuestions =
      answeredExerciseIds.length > 0
        ? await fetchQuestionsForExerciseIds({
            supabase,
            exerciseIds: answeredExerciseIds,
            count: answeredExerciseIds.length,
            includeDraft: includeDraftQuestions,
          })
        : [];

    let questions = [...answeredQuestions];

    for (const question of primaryQuestions) {
      if (questions.some((item) => item.id === question.id)) {
        continue;
      }

      questions.push(question);

      if (questions.length >= effectiveCount) {
        break;
      }
    }

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

      console.error("[quiz-session] question parse failed", details);

      return NextResponse.json(
        {
          error: "Nie udalo sie sparsowac przyporzadkowanego testu z bazy danych.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      sessionId,
      mode,
      setId: selectedSet?.id,
      modes: effectiveModes,
      focusLabel: requestedFocusLabel,
      focusSource: requestedFocusSource,
      focusRaw: requestedFocusRaw,
      status: typeof session.status === "string" ? session.status : "in_progress",
      questions,
      answers,
    });
  } catch (error) {
    console.error("[quiz-session] unexpected error", error);

    return NextResponse.json(
      {
        error: "Wystapil blad podczas pobierania quizu.",
      },
      { status: 500 },
    );
  }
}
