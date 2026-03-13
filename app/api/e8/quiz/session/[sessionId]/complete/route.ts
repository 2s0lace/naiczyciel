import { NextResponse } from "next/server";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import { buildSummary, fetchQuestionsForExerciseIds, fetchQuestionsForMode, fetchSessionAnswers } from "@/lib/quiz/repository";
import { getSetsForTier } from "@/lib/quiz/set-catalog";
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

function normalizeSetId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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
    const selectedSet = requestedSetId ? allowedSetMap.get(requestedSetId) ?? null : null;
    const resolvedMode = selectedSet?.mode ?? fallbackMode;

    if (isLocalSessionId(sessionId)) {
      const { summary } = completeLocalSession({
        sessionId,
        mode: resolvedMode,
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
        mode: resolvedMode,
        summary: body.summary,
      });

      return NextResponse.json({
        ok: true,
        sessionId,
        summary,
        storage: "local",
      });
    }

    const sessionResult = await supabase
      .from("quiz_sessions")
      .select("id")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionResult.error || !sessionResult.data?.id) {
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
          details: sessionResult.error?.message,
        },
        { status: 404 },
      );
    }

    const [questions, answers] = await Promise.all([
      selectedSet?.questionIds && selectedSet.questionIds.length > 0
        ? fetchQuestionsForExerciseIds({
            supabase,
            exerciseIds: selectedSet.questionIds,
            count: selectedSet.questionCount,
          })
        : fetchQuestionsForMode({
            supabase,
            mode: resolvedMode,
            count: 10,
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
