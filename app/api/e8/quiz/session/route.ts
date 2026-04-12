import { NextResponse } from "next/server";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import { createLocalSessionFromQuestions } from "@/lib/quiz/local-store";
import { getMockQuestions } from "@/lib/quiz/mock-data";
import { clampQuestionCount } from "@/lib/quiz/repository";
import { getSetSlots, getSetsForTier, resolveQuizModeForStart } from "@/lib/quiz/set-catalog";
import { loadSetCatalogFromDatabase } from "@/lib/quiz/set-catalog-store";
import { getSupabaseUserClient } from "@/lib/supabase/server";

type StartSessionBody = {
  mode?: string;
  questionCount?: number;
  setId?: string;
  modes?: string[];
  focusLabel?: string;
  focusSource?: string;
  focusRaw?: string;
};

function normalizeMode(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeModeList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeMode(entry))
    .filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index);
}

function normalizeSetId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeFocusLabel(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeFocusSource(value: unknown): "grammar" | "vocabulary" | "skill" | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "grammar" || normalized === "vocabulary" || normalized === "skill" ? normalized : null;
}

function isBuiltinMockSetId(value: string | undefined): boolean {
  return value === "set_mock_reading_mc" || value === "set_mock_gap_fill_text";
}

function serializeAdaptiveMode(modes: string[]): string {
  const normalized = modes
    .map((entry) => normalizeMode(entry))
    .filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index);

  if (normalized.length <= 1) {
    return normalized[0] ?? "auto";
  }

  return `mixed:${normalized.join(",")}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as StartSessionBody;
    const requestedMode = typeof body.mode === "string" ? body.mode : "auto";
    const requestedSetId = normalizeSetId(body.setId);
    const requestedFocusLabel = normalizeFocusLabel(body.focusLabel);
    const requestedFocusSource = normalizeFocusSource(body.focusSource);
    const requestedFocusRaw = normalizeFocusLabel(body.focusRaw);
    const access = await resolveAccessTierFromRequest(request);
    await loadSetCatalogFromDatabase({
      accessToken: access.accessToken,
      allowBootstrap: false,
    });

    const tierSets = getSetsForTier(access.tier);
    const tierModes = tierSets
      .map((setItem) => normalizeMode(setItem.mode))
      .filter((mode, index, list) => mode.length > 0 && list.indexOf(mode) === index);
    const tierSetMap = new Map(tierSets.map((setItem) => [setItem.id, setItem]));
    const allSetMap = access.role === "admin" ? new Map(getSetSlots().map((setItem) => [setItem.id, setItem])) : null;

    const requestedSet = requestedSetId
      ? tierSetMap.get(requestedSetId) ?? allSetMap?.get(requestedSetId) ?? null
      : null;

    if (requestedSetId && !requestedSet) {
      return NextResponse.json(
        {
          error: "Wybrany zestaw nie jest dostepny.",
        },
        { status: 400 },
      );
    }

    const resolvedMode =
      requestedSet?.mode ??
      resolveQuizModeForStart({
        requestedMode,
        tier: access.tier,
        isAuthenticated: access.tier !== "unregistered",
      });

    const requestedModes = normalizeModeList(body.modes).filter((mode) => tierModes.includes(mode));
    const selectedModes = requestedSet
      ? [normalizeMode(requestedSet.mode)]
      : requestedModes.length > 0
        ? requestedModes
        : requestedMode.trim().toLowerCase() !== "auto"
          ? [normalizeMode(resolvedMode)]
          : tierModes;

    const effectiveSet = requestedSet ?? null;
    const mode = effectiveSet?.mode ?? serializeAdaptiveMode(selectedModes);

    const requestedCountRaw =
      typeof body.questionCount === "number" && Number.isFinite(body.questionCount)
        ? body.questionCount
        : null;

    const requestedCount = requestedCountRaw ?? 10;
    const questionCount = clampQuestionCount(requestedCount);
    const effectiveSetId = effectiveSet?.id;

    if (isBuiltinMockSetId(effectiveSetId) || !access.userId || !access.accessToken) {
      const localSession = createLocalSessionFromQuestions({
        mode,
        questions: getMockQuestions(mode, effectiveSet?.questionCount ?? questionCount),
        ownerUserId: access.userId,
      });

      return NextResponse.json({
        sessionId: localSession.id,
        mode,
        setId: effectiveSetId,
        modes: selectedModes,
        questionCount: localSession.questionCount,
        storage: "local",
      });
    }

    const supabase = getSupabaseUserClient(access.accessToken);
    const generatedSessionId = crypto.randomUUID();
    const startedAt = new Date().toISOString();

    const baseVariants: Array<Record<string, string | number | null>> = [
      {
        id: generatedSessionId,
        user_id: access.userId,
        mode,
        status: "in_progress",
        requested_count: questionCount,
        started_at: startedAt,
        branch: "e8",
      },
      {
        id: generatedSessionId,
        user_id: access.userId,
        mode,
        status: "in_progress",
        requested_count: questionCount,
        started_at: startedAt,
      },
      {
        id: generatedSessionId,
        user_id: access.userId,
        mode,
        status: "in_progress",
        started_at: startedAt,
        branch: "e8",
      },
      {
        id: generatedSessionId,
        user_id: access.userId,
        mode,
        status: "in_progress",
        started_at: startedAt,
      },
      {
        id: generatedSessionId,
        user_id: access.userId,
        mode,
        started_at: startedAt,
        branch: "e8",
      },
      {
        id: generatedSessionId,
        user_id: access.userId,
        mode,
        started_at: startedAt,
      },
      {
        id: generatedSessionId,
        user_id: access.userId,
        mode,
        branch: "e8",
      },
      {
        id: generatedSessionId,
        user_id: access.userId,
        mode,
      },
    ];

    const insertVariants =
      effectiveSetId
        ? [
            ...baseVariants.map((payload) => ({ ...payload, set_id: effectiveSetId })),
            ...baseVariants,
          ]
        : baseVariants;

    let createdSessionId: string | null = null;
    let insertError: { message?: string } | null = null;

    for (const payload of insertVariants) {
      const result = await supabase.from("quiz_sessions").insert(payload).select("id").single();

      if (!result.error && result.data?.id) {
        createdSessionId = String(result.data.id);
        break;
      }

      insertError = result.error ?? insertError;
    }

    if (!createdSessionId) {
      console.error("[quiz-start] insert failed", insertError);
      return NextResponse.json(
        {
          error: "Nie udalo sie utworzyc sesji quizu w bazie.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      sessionId: createdSessionId,
      mode,
      setId: effectiveSetId,
      modes: selectedModes,
      questionCount,
      focusLabel: requestedFocusLabel,
      focusSource: requestedFocusSource,
      focusRaw: requestedFocusRaw,
      storage: "supabase",
    });
  } catch (error) {
    console.error("[quiz-start] unexpected error", error);

    return NextResponse.json(
      {
        error: "Wystapil blad podczas startu sesji.",
      },
      { status: 500 },
    );
  }
}
