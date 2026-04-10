import { NextResponse } from "next/server";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import { buildSummary, clampQuestionCount, fetchQuestionsForExerciseIds, fetchQuestionsForMode, fetchSessionAnswers } from "@/lib/quiz/repository";
import { getSetSlots, getSetsForTier } from "@/lib/quiz/set-catalog";
import { loadSetCatalogFromDatabase } from "@/lib/quiz/set-catalog-store";
import type { QuizSummary } from "@/lib/quiz/types";
import {
  completeLocalSession,
  getLocalSessionPayload,
  isLocalSessionId,
} from "@/lib/quiz/local-store";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

type CompleteBody = {
  summary?: QuizSummary;
  mode?: string;
  setId?: string;
};

type SessionLookupRow = {
  id?: string;
  set_id?: string | null;
  requested_count?: number | null;
  mode?: string | null;
};

async function loadSessionRow(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  sessionId: string,
): Promise<{ row: SessionLookupRow | null; error: string | null }> {
  const selectVariants = [
    "id, set_id, requested_count, mode",
    "id, requested_count, mode",
    "id, mode",
    "id, requested_count",
    "id",
  ] as const;

  let lastError: string | null = null;

  for (const select of selectVariants) {
    const result = await supabase
      .from("quiz_sessions")
      .select(select)
      .eq("id", sessionId)
      .maybeSingle();

    if (!result.error) {
      return {
        row: (result.data as SessionLookupRow | null) ?? null,
        error: null,
      };
    }

    lastError = result.error.message;
  }

  return {
    row: null,
    error: lastError ?? "Nie udalo sie pobrac sesji.",
  };
}

function normalizeSetId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asFiniteNumber(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json({ error: "Brak sessionId." }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as CompleteBody;
    const fallbackMode = typeof body.mode === "string" ? body.mode : "reactions";
    const requestedSetId = normalizeSetId(body.setId);
    const access = await resolveAccessTierFromRequest(request);
    await loadSetCatalogFromDatabase();
    const allowedSetMap = new Map(getSetsForTier(access.tier).map((setItem) => [setItem.id, setItem]));
    const allSetMap = access.role === "admin" ? new Map(getSetSlots().map((setItem) => [setItem.id, setItem])) : null;

    if (isLocalSessionId(sessionId)) {
      const { summary } = completeLocalSession({
        sessionId,
        mode: fallbackMode,
        summary: body.summary,
      });

      return NextResponse.json({
        ok: true,
        sessionId,
        summary,
        storage: "local",
      });
    }

    let supabase: ReturnType<typeof getSupabaseServerClient> | null = null;

    try {
      supabase = getSupabaseServerClient();
    } catch {
      const { summary } = completeLocalSession({
        sessionId,
        mode: fallbackMode,
        summary: body.summary,
      });

      return NextResponse.json({
        ok: true,
        sessionId,
        summary,
        storage: "local",
      });
    }

    const sessionResult = await loadSessionRow(supabase, sessionId);

    if (sessionResult.error || !sessionResult.row?.id) {
      const localPayload = getLocalSessionPayload(sessionId);

      if (localPayload) {
        const { summary } = completeLocalSession({
          sessionId,
          mode: localPayload.mode,
          summary: body.summary,
        });

        return NextResponse.json({
          ok: true,
          sessionId,
          summary,
          storage: "local",
        });
      }

      return NextResponse.json(
        {
          error: "Nie znaleziono sesji do zakonczenia.",
          details: sessionResult.error,
        },
        { status: 404 },
      );
    }

    const sessionRow = sessionResult.row;
    const effectiveSetId = requestedSetId ?? normalizeSetId(sessionRow?.set_id);
    const selectedSet = effectiveSetId
      ? allowedSetMap.get(effectiveSetId) ?? allSetMap?.get(effectiveSetId) ?? null
      : null;
    const resolvedMode = selectedSet?.mode ?? (typeof sessionRow?.mode === "string" ? sessionRow.mode : fallbackMode);
    const requestedCount = clampQuestionCount(asFiniteNumber(sessionRow?.requested_count) ?? 10);

    const [questions, answers] = await Promise.all([
      selectedSet?.questionIds && selectedSet.questionIds.length > 0
        ? fetchQuestionsForExerciseIds({
            supabase,
            exerciseIds: selectedSet.questionIds,
            count: Math.min(requestedCount, selectedSet.questionIds.length),
            shuffleSeed: selectedSet.questionIds.length > requestedCount ? sessionId : undefined,
          })
        : fetchQuestionsForMode({
            supabase,
            mode: resolvedMode,
            count: requestedCount,
          }),
      fetchSessionAnswers({
        supabase,
        sessionId,
      }),
    ]);

    const computedSummary = buildSummary({ questions, answers });
    const summary = body.summary ?? computedSummary;

    const finishedAt = new Date().toISOString();
    const completedPatch: Record<string, string | number> = {
      status: "completed",
      completed_at: finishedAt,
      total_questions: summary.totalQuestions,
      correct_answers: summary.correctAnswers,
      score_percent: summary.scorePercent,
    };

    if (access.userId) {
      completedPatch.user_id = access.userId;
    }

    const primaryUpdate = await supabase
      .from("quiz_sessions")
      .update(completedPatch)
      .eq("id", sessionId);

    if (primaryUpdate.error) {
      const fallbackPatch: Record<string, string> = {
        status: "completed",
        completed_at: finishedAt,
      };

      if (access.userId) {
        fallbackPatch.user_id = access.userId;
      }

      await supabase
        .from("quiz_sessions")
        .update(fallbackPatch)
        .eq("id", sessionId);
    }

    const statsPayload = {
      session_id: sessionId,
      mode: resolvedMode,
      total_questions: summary.totalQuestions,
      correct_answers: summary.correctAnswers,
      score_percent: summary.scorePercent,
      synced_at: finishedAt,
    };

    const upsertStats = await supabase
      .from("quiz_result_stats")
      .upsert(statsPayload, { onConflict: "session_id" });

    if (upsertStats.error) {
      const fallbackInsert = await supabase
        .from("quiz_result_stats")
        .insert(statsPayload);

      if (fallbackInsert.error) {
        return NextResponse.json(
          {
            error: "Nie udalo sie zapisac statystyk sesji.",
            details: fallbackInsert.error.message,
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      ok: true,
      sessionId,
      summary,
      storage: "supabase",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Nie udalo sie zakonczyc sesji.",
        details: message,
      },
      { status: 500 },
    );
  }
}
