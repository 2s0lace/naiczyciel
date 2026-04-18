import { NextResponse } from "next/server";
import { resolveAccessTierFromRequest } from "@/lib/quiz/access-tier";
import { fetchSessionAnswers } from "@/lib/quiz/repository";
import {
  completeLocalSession,
  getAccessibleLocalSession,
  isLocalSessionId,
} from "@/lib/quiz/local-store";
import {
  buildCanonicalCategoryBreakdownFromAnswers,
  buildCanonicalSummaryFromBreakdown,
  buildCanonicalCategoryBreakdown,
  upsertSessionCategoryStats,
} from "@/lib/quiz/session-category-stats";
import { requireOwnedSession } from "@/lib/quiz/require-owned-session";
import { loadSetCatalogFromDatabase } from "@/lib/quiz/set-catalog-store";
import { getSupabaseUserClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

type CompleteBody = {
  mode?: string;
  setId?: string;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json({ error: "Brak sessionId." }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as CompleteBody;
    const fallbackMode = typeof body.mode === "string" ? body.mode : "reactions";
    const access = await resolveAccessTierFromRequest(request);

    if (isLocalSessionId(sessionId)) {
      const localSession = getAccessibleLocalSession(sessionId, access.userId);

      if (!localSession) {
        return NextResponse.json(
          {
            error: "Nie udalo sie rozpoczac quizu. Brak lokalnej sesji.",
          },
          { status: 404 },
        );
      }

      const { summary } = completeLocalSession({
        sessionId,
        mode: fallbackMode,
        userId: access.userId,
      });

      return NextResponse.json({
        ok: true,
        sessionId,
        summary,
        storage: "local",
      });
    }

    if (!access.userId || !access.accessToken) {
      return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
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
          error: "Nie znaleziono sesji do zakonczenia.",
        },
        { status: 404 },
      );
    }

    const answers = await fetchSessionAnswers({
      supabase,
      sessionId,
    });

    const categoryBreakdown =
      answers.length > 0
        ? await buildCanonicalCategoryBreakdownFromAnswers({
            supabase,
            answers,
          })
        : buildCanonicalCategoryBreakdown({ questions: [], answers: [] });
    const summary = buildCanonicalSummaryFromBreakdown(categoryBreakdown);
    const finishedAt = new Date().toISOString();
    const completedPatch: Record<string, string | number> = {
      status: "completed",
      completed_at: finishedAt,
      total_questions: summary.totalQuestions,
      correct_answers: summary.correctAnswers,
      score_percent: summary.scorePercent,
      user_id: access.userId,
    };

    const primaryUpdate = await supabase
      .from("quiz_sessions")
      .update(completedPatch)
      .eq("id", sessionId)
      .eq("user_id", access.userId);

    if (primaryUpdate.error) {
      const fallbackPatch: Record<string, string | number> = {
        status: "completed",
        completed_at: finishedAt,
        total_questions: summary.totalQuestions,
        correct_answers: summary.correctAnswers,
        score_percent: summary.scorePercent,
        user_id: access.userId,
      };

      const fallbackUpdate = await supabase
        .from("quiz_sessions")
        .update(fallbackPatch)
        .eq("id", sessionId)
        .eq("user_id", access.userId);

      if (fallbackUpdate.error) {
        console.error("[quiz-complete] session update failed", primaryUpdate.error, fallbackUpdate.error);
        return NextResponse.json(
          {
            error: "Nie udalo sie zakonczyc sesji.",
          },
          { status: 500 },
        );
      }
    }

    const statsPayload = {
      session_id: sessionId,
      mode: typeof sessionRow.mode === "string" ? sessionRow.mode : fallbackMode,
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
        console.error("[quiz-complete] stats write failed", upsertStats.error, fallbackInsert.error);
        return NextResponse.json(
          {
            error: "Nie udalo sie zapisac statystyk sesji.",
          },
          { status: 500 },
        );
      }
    }

    const categoryStatsWrite = await upsertSessionCategoryStats({
      supabase,
      sessionId,
      breakdown: categoryBreakdown,
      syncedAt: finishedAt,
    });

    if (categoryStatsWrite.error) {
      console.error("[quiz-complete] category stats write failed", categoryStatsWrite.error);
    }

    return NextResponse.json({
      ok: true,
      sessionId,
      summary: {
        ...summary,
        categoryBreakdown,
      },
      storage: "supabase",
    });
  } catch (error) {
    console.error("[quiz-complete] unexpected error", error);

    return NextResponse.json(
      {
        error: "Nie udalo sie zakonczyc sesji.",
      },
      { status: 500 },
    );
  }
}
