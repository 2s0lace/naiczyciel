import { NextResponse } from "next/server";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import { createLocalSessionFromQuestions } from "@/lib/quiz/local-store";
import { getMockQuestions } from "@/lib/quiz/mock-data";
import { clampQuestionCount } from "@/lib/quiz/repository";
import { getSetSlots, getSetsForTier, resolveQuizModeForStart } from "@/lib/quiz/set-catalog";
import { loadSetCatalogFromDatabase } from "@/lib/quiz/set-catalog-store";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type StartSessionBody = {
  mode?: string;
  questionCount?: number;
  setId?: string;
};

function normalizeSetId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isBuiltinMockSetId(value: string | undefined): boolean {
  return value === "set_mock_reading_mc" || value === "set_mock_gap_fill_text";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as StartSessionBody;
    const requestedMode = typeof body.mode === "string" ? body.mode : "auto";
    const requestedSetId = normalizeSetId(body.setId);
    const access = await resolveAccessTierFromRequest(request);
    await loadSetCatalogFromDatabase();

    const tierSets = getSetsForTier(access.tier);
    const tierSetMap = new Map(tierSets.map((setItem) => [setItem.id, setItem]));
    const allSetMap = access.role === "admin" ? new Map(getSetSlots().map((setItem) => [setItem.id, setItem])) : null;

    const requestedSet = requestedSetId
      ? tierSetMap.get(requestedSetId) ?? allSetMap?.get(requestedSetId) ?? null
      : null;

    if (requestedSetId && !requestedSet) {
      return NextResponse.json(
        {
          error: "Wybrany zestaw nie jest dostepny.",
          details: "Set nie jest przypisany do Twojego dostepu lub nie istnieje.",
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

    const autoAssignedSet =
      !requestedSet && tierSets.length > 0
        ? tierSets.find((setItem) => setItem.mode.trim().toLowerCase() === resolvedMode.trim().toLowerCase()) ?? tierSets[0] ?? null
        : null;

    const effectiveSet = requestedSet ?? autoAssignedSet ?? null;
    const mode = effectiveSet?.mode ?? resolvedMode;

    const requestedCountRaw =
      typeof body.questionCount === "number" && Number.isFinite(body.questionCount)
        ? body.questionCount
        : null;

    const requestedCount = requestedCountRaw ?? 10;
    const questionCount = clampQuestionCount(requestedCount);
    const effectiveSetId = effectiveSet?.id;

    if (isBuiltinMockSetId(effectiveSetId)) {
      const localSession = createLocalSessionFromQuestions({
        mode,
        questions: getMockQuestions(mode, effectiveSet?.questionCount ?? 2),
      });

      return NextResponse.json({
        sessionId: localSession.id,
        mode,
        setId: effectiveSetId,
        questionCount: localSession.questionCount,
        storage: "local",
      });
    }

    let supabase: ReturnType<typeof getSupabaseServerClient>;

    try {
      supabase = getSupabaseServerClient();
    } catch {
      return NextResponse.json(
        {
          error: "Brak polaczenia z baza danych.",
          details: "Tryb lokalny/mock jest wylaczony. Sprobuj ponownie, gdy baza bedzie dostepna.",
        },
        { status: 500 },
      );
    }

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
      return NextResponse.json(
        {
          error: "Nie udalo sie utworzyc sesji quizu w bazie.",
          details: insertError?.message ?? "Brak szczegolow bledu z bazy.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      sessionId: createdSessionId,
      mode,
      setId: effectiveSetId,
      questionCount,
      storage: "supabase",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Wystapil blad podczas startu sesji.",
        details: message,
      },
      { status: 500 },
    );
  }
}
